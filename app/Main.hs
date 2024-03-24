{-# LANGUAGE DataKinds #-}
{-# LANGUAGE DeriveGeneric #-}
{-# LANGUAGE DerivingStrategies #-}
{-# LANGUAGE EmptyDataDecls #-}
{-# LANGUAGE FlexibleContexts #-}
{-# LANGUAGE FlexibleInstances #-}
{-# LANGUAGE GADTs #-}
{-# LANGUAGE GeneralizedNewtypeDeriving #-}
{-# LANGUAGE ImportQualifiedPost #-}
{-# LANGUAGE MultiParamTypeClasses #-}
{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE QuasiQuotes #-}
{-# LANGUAGE StandaloneDeriving #-}
{-# LANGUAGE TemplateHaskell #-}
{-# LANGUAGE TypeApplications #-}
{-# LANGUAGE TypeFamilies #-}
{-# LANGUAGE TypeOperators #-}
{-# LANGUAGE UndecidableInstances #-}

module Main where

import Control.Exception (bracket, throwIO)
import Control.Monad.IO.Class (MonadIO, liftIO)
import Control.Monad.Logger (runStdoutLoggingT)
import Control.Monad.Trans.Maybe (MaybeT (..), runMaybeT)
import Data.Aeson (FromJSON, ToJSON (toJSON), encode)
import Data.ByteString qualified as BS
import Data.ByteString.Lazy qualified as Lazy
import Data.Password.Bcrypt
  ( Bcrypt
  , PasswordCheck (PasswordCheckFail, PasswordCheckSuccess)
  , PasswordHash (..)
  , checkPassword
  , hashPassword
  , mkPassword
  )
import Data.Pool (destroyAllResources)
import Data.Text (Text)
import Data.Text qualified as T
import Data.Text.Encoding qualified as T
import Data.Time (UTCTime, getCurrentTime)
import Database.Esqueleto.Experimental
import Database.Persist.Postgresql (ConnectionString, createPostgresqlPool)
import Database.Persist.TH (mkMigrate, mkPersist, persistLowerCase, share, sqlSettings)
import GHC.Generics (Generic)
import Lucid as L
import Lucid.Base (makeAttribute)
import Network.HTTP.Media ((//), (/:))
import Network.Wai.Handler.Warp (run)
import Servant
import Servant.Auth.Server
import System.Environment (lookupEnv)
import Web.FormUrlEncoded (FromForm)

share
  [mkPersist sqlSettings, mkMigrate "migrateAll"]
  [persistLowerCase|
Account
  username Text UNIQUE
  password Text
  deriving Generic
Todo
  title Text
  status Bool default=False
  accountId AccountId
  created UTCTime default=CURRENT_TIME
  deriving Generic
|]

hyperscript_ :: Text -> Attribute
hyperscript_ = makeAttribute "_"

hxPost_ :: Text -> Attribute
hxPost_ = makeAttribute "hx-post"

hxGet_ :: Text -> Attribute
hxGet_ = makeAttribute "hx-get"

hxPut_ :: Text -> Attribute
hxPut_ = makeAttribute "hx-put"

hxVals_ :: Text -> Attribute
hxVals_ = makeAttribute "hx-vals"

hxDelete_ :: Text -> Attribute
hxDelete_ = makeAttribute "hx-delete"

hxSwap_ :: Text -> Attribute
hxSwap_ = makeAttribute "hx-swap"

hxTarget_ :: Text -> Attribute
hxTarget_ = makeAttribute "hx-target"

hxTrigger_ :: Text -> Attribute
hxTrigger_ = makeAttribute "hx-trigger"

instance FromForm Account

instance FromForm Todo

instance ToJSON Todo

instance FromJSON Todo

newtype AuthenticatedAccount = AuthenticatedAccount {accId :: AccountId} deriving (Generic, Show)

instance ToJSON AuthenticatedAccount

instance ToJWT AuthenticatedAccount

instance FromJSON AuthenticatedAccount

instance FromJWT AuthenticatedAccount

instance ToHtml Todo where
  toHtml = p_ . toHtml . todoTitle
  toHtmlRaw = toHtml

jsonStringify :: (ToJSON a) => a -> Text
jsonStringify = T.decodeUtf8 . Lazy.toStrict . encode . toJSON

instance ToHtml (Entity Todo) where
  toHtml entityTodo = li_ [hxTarget_ "this", hxSwap_ "outerHTML"] $ do
    L.with (toHtml todo') [class_ "line-through" | status]

    input_ $
      [ type_ "checkbox"
      , id_ "status"
      , name_ "status"
      , hxTrigger_ "click"
      , hxPut_ $ "/todo/" <> todoId'
      , hxVals_ updatedTodo
      ]
        <> [checked_ | status]

    button_
      [hxDelete_ $ "/todo/" <> todoId', hyperscript_ "on htmx:afterOnLoad remove the closest <li/>"]
      "X"
    where
      todo'@(Todo _ status _ _) = entityVal entityTodo
      todoId' = T.pack $ show $ fromSqlKey $ entityKey entityTodo
      updatedTodo = jsonStringify $ todo' {todoStatus = not status}

  toHtmlRaw = toHtml

instance ToHtml [Entity Todo] where
  toHtml = ul_ [id_ "todo-list"] . foldMap toHtml
  toHtmlRaw = toHtml

newtype TodoForm = TodoForm {title :: Text} deriving (Generic)

instance FromForm TodoForm

instance ToJSON TodoForm

instance FromJSON TodoForm

data HTML

instance Accept HTML where
  contentType _ = "text" // "html" /: ("charset", "utf-8")

newtype RawHtml = RawHtml {unRaw :: Lazy.ByteString}

instance MimeRender HTML RawHtml where
  mimeRender _ = unRaw

type AcceptHeaders returnContent =
  Headers
    '[ Header "Set-Cookie" SetCookie
     , Header "Set-Cookie" SetCookie
     ]
    returnContent

type Protected =
  Auth '[Cookie] AuthenticatedAccount
    :> ( Get '[HTML] RawHtml
          :<|> "todo"
            :> ( Get '[HTML] RawHtml
                  :<|> ReqBody '[FormUrlEncoded] TodoForm :> Verb 'POST 201 '[HTML] RawHtml
                  :<|> Capture "todoId" TodoId
                    :> ((ReqBody '[FormUrlEncoded] Todo :> Verb 'PUT 201 '[HTML] RawHtml) :<|> Delete '[JSON] NoContent)
               )
       )

type Unprotected =
  "signup"
    :> ( Get '[HTML] RawHtml
          :<|> ReqBody '[FormUrlEncoded] Account :> Verb 'POST 204 '[FormUrlEncoded] (AcceptHeaders NoContent)
       )
    :<|> "login"
      :> ( Get '[HTML] RawHtml
            :<|> ReqBody '[FormUrlEncoded] Account :> Verb 'POST 204 '[FormUrlEncoded] (AcceptHeaders NoContent)
         )

type API = Protected :<|> Unprotected

baseRender :: (Monad m) => Text -> HtmlT m a -> HtmlT m a
baseRender title' innerHtml = do
  doctype_

  html_ [lang_ "en"] ""

  head_ $ do
    meta_ [charset_ "utf-8"]

    meta_ [name_ "viewport", content_ "width=device-width, initial-scale=1.0"]

    script_ [src_ "https://cdn.tailwindcss.com"] ("" :: String)

    script_ [src_ "https://unpkg.com/htmx.org@1.9.11"] ("" :: String)

    script_ [src_ "https://unpkg.com/hyperscript.org@0.9.12"] ("" :: String)

    title_ (toHtml title')

  body_ innerHtml

renderRawHtml :: Html a -> RawHtml
renderRawHtml = RawHtml . renderBS

loginSignupPage :: RawHtml
loginSignupPage = renderRawHtml $ baseRender "Homepage" $ div_ $ do
  a_ [href_ "/login"] "Login"
  a_ [href_ "/signup"] "Signup"

input :: (Monad m) => Text -> Text -> Text -> HtmlT m ()
input lbl typ name = div_ $ do
  label_ [for_ name] $ toHtml lbl
  input_ [type_ typ, name_ name, id_ name, required_ "true"]

authError :: Attribute
authError =
  hyperscript_
    "on htmx:afterOnLoad\
    \  if event.detail.successful\
    \    set #error.innerHTML to '\160'\
    \    go to url '/'\
    \  else if event.detail.xhr.status is 401\
    \    set #error.innerHTML to event.detail.xhr.responseText\
    \  else\
    \    set #error.innerHTML to 'Server error'"

signupPage :: RawHtml
signupPage = renderRawHtml $
  baseRender "Signup" $
    form_ [hxPost_ "/signup", authError] $
      do
        div_ $ do
          span_ [id_ "error"] "\160"

        input "Username:" "text" "accountUsername"

        input "Password:" "password" "accountPassword"

        input "Confirm Password:" "password" "confirm-password"

        button_
          [ type_ "submit"
          , hyperscript_
              "on keyup from closest <form/>\
              \   if #accountPassword.value is not #confirm-password.value\
              \     put 'Passwords does not match' into me\
              \     add @disabled\
              \   else\
              \     put 'Submit' into me\
              \     remove @disabled"
          ]
          "Submit"

loginPage :: RawHtml
loginPage = renderRawHtml
  $ baseRender "Login"
  $ form_
    [hxPost_ "/login", authError]
  $ do
    div_ $ do
      span_ [id_ "error"] "\160"

    input "Username:" "text" "accountUsername"

    input "Password:" "password" "accountPassword"

    button_ [type_ "submit"] "Submit"

getAllTodosDB :: (MonadIO m) => AccountId -> SqlPersistT m [Entity Todo]
getAllTodosDB accId' = select $ do
  todos <- from $ table @Todo
  where_ (todos ^. TodoAccountId ==. val accId')
  orderBy [desc (todos ^. TodoCreated)]
  return todos

deleteTodoDB :: (MonadIO m) => TodoId -> AccountId -> SqlPersistT m ()
deleteTodoDB todoId accId' = delete $ do
  todo' <- from $ table @Todo
  where_
    ( todo'
        ^. TodoId
        ==. val todoId
        &&. todo'
        ^. TodoAccountId
        ==. val accId'
    )

updateTodoDB :: (MonadIO m) => AccountId -> TodoId -> Todo -> SqlPersistT m ()
updateTodoDB accId' todoId (Todo title' status _ _) = update $ \t -> do
  set t [TodoTitle =. val title', TodoStatus =. val status]
  where_ (t ^. TodoId ==. val todoId &&. t ^. TodoAccountId ==. val accId')

protected :: ConnectionPool -> Server Protected
protected connPool (Authenticated (AuthenticatedAccount accId')) =
  homepage
    :<|> getAllTodos
    :<|> addTodo
    :<|> updateDeleteTodo
  where
    homepage :: Handler RawHtml
    homepage = do
      return $ renderRawHtml $ baseRender "Homepage" $ do
        form_
          [ hxPost_ "/todo"
          , hxTarget_ "#todo-list"
          , hxSwap_ "afterbegin"
          , hyperscript_ "on htmx:afterOnLoad set #title.value to ''"
          ]
          $ do
            input "Title" "text" "title"

            button_ [type_ "submit"] "Submit"

        ul_ [hxGet_ "/todo", hxSwap_ "outerHTML", hxTrigger_ "revealed"] ""

    getAllTodos :: Handler RawHtml
    getAllTodos = do
      todos <- liftIO $ liftSqlPersistMPool (getAllTodosDB accId') connPool
      return $ renderRawHtml $ toHtml todos

    addTodo :: TodoForm -> Handler RawHtml
    addTodo (TodoForm title') = do
      now <- liftIO getCurrentTime
      let todo' = Todo title' False accId' now
      todoId <- liftIO $ liftSqlPersistMPool (insert todo') connPool
      let entityTodo = Entity todoId todo'
      return $ renderRawHtml $ toHtml entityTodo

    updateDeleteTodo :: TodoId -> (Todo -> Handler RawHtml) :<|> Handler NoContent
    updateDeleteTodo todoId = updateTodo todoId :<|> deleteTodo todoId

    updateTodo :: TodoId -> Todo -> Handler RawHtml
    updateTodo todoId todo' = do
      liftIO $ liftSqlPersistMPool (updateTodoDB accId' todoId todo') connPool
      return $ renderRawHtml $ toHtml (Entity todoId todo')

    deleteTodo :: TodoId -> Handler NoContent
    deleteTodo todoId = do
      liftIO $ liftSqlPersistMPool (deleteTodoDB todoId accId') connPool
      return NoContent
protected _ _ = return loginSignupPage :<|> throwAll err401

getAuthenticatedCookies
  :: CookieSettings
  -> JWTSettings
  -> AuthenticatedAccount
  -> Handler (AcceptHeaders NoContent)
getAuthenticatedCookies cs jwts aacc = do
  mApplyCookies <- liftIO $ acceptLogin cs jwts aacc

  case mApplyCookies of
    Just applyCookies -> return $ applyCookies NoContent
    Nothing -> throwError err401

getAccount :: (MonadIO m) => Account -> SqlPersistT m [Entity Account]
getAccount (Account username _) = select $ do
  acc <- from $ table @Account
  where_ (acc ^. AccountUsername ==. val username)
  return acc

loginDB :: (MonadIO m) => Account -> SqlPersistT m [Entity Account]
loginDB acc@(Account _ pass) = do
  acc' <- getAccount acc
  case entityVal <$> acc' of
    [Account _ password] ->
      case checkPassword (mkPassword pass) (PasswordHash password) of
        PasswordCheckSuccess -> return acc'
        PasswordCheckFail -> return []
    _anyFailure -> return []

mkHashedPassword :: (MonadIO m) => Text -> m (PasswordHash Bcrypt)
mkHashedPassword = hashPassword . mkPassword

unprotected :: CookieSettings -> JWTSettings -> ConnectionPool -> Server Unprotected
unprotected cs jwts connPool = signup :<|> login
  where
    signup :: Handler RawHtml :<|> (Account -> Handler (AcceptHeaders NoContent))
    signup = return signupPage :<|> signup'

    signup' :: Account -> Handler (AcceptHeaders NoContent)
    signup' acc@(Account username password) = do
      usernameExists <- liftIO $ liftSqlPersistMPool (getAccount acc) connPool
      case usernameExists of
        [] -> do
          hashedPass <- unPasswordHash <$> mkHashedPassword password
          accId' <- liftIO $ liftSqlPersistMPool (insert (Account username hashedPass)) connPool
          getAuthenticatedCookies cs jwts $ AuthenticatedAccount accId'
        _anyFailure -> throwError $ err401 {errBody = "Username already exists"}

    login :: Handler RawHtml :<|> (Account -> Handler (AcceptHeaders NoContent))
    login = return loginPage :<|> login'

    login' :: Account -> Handler (AcceptHeaders NoContent)
    login' acc = do
      acc' <- liftIO $ liftSqlPersistMPool (loginDB acc) connPool
      case entityKey <$> acc' of
        [accId'] -> getAuthenticatedCookies cs jwts (AuthenticatedAccount accId')
        _anyFailure -> throwError $ err401 {errBody = "Wrong username or password"}

server :: CookieSettings -> JWTSettings -> ConnectionPool -> Server API
server cs jwts connPool = protected connPool :<|> unprotected cs jwts connPool

app :: JWTSettings -> ConnectionPool -> Application
app jwts connPool = serveWithContext api cfg (server cookieSettings jwts connPool)
  where
    api = Proxy :: Proxy API
    cfg = cookieSettings :. jwts :. EmptyContext
    cookieSettings =
      defaultCookieSettings
        { cookieIsSecure = NotSecure
        , cookieSameSite = SameSiteStrict
        , cookieXsrfSetting = Nothing
        }

mkPool :: ConnectionString -> Int -> IO ConnectionPool
mkPool = (runStdoutLoggingT .) . createPostgresqlPool

closePool :: ConnectionPool -> IO ()
closePool = destroyAllResources

main :: IO ()
main = do
  myKey <- generateKey
  let jwtCfg = defaultJWTSettings myKey
  connStr <- runMaybeT $ do
    let keys =
          [ "host="
          , "port="
          , "user="
          , "password="
          , "dbname="
          ]
        envs =
          [ "PGHOST"
          , "PGPORT"
          , "PGUSER"
          , "PGPASS"
          , "PGDATABASE"
          ]
    envVars <- traverse (MaybeT . lookupEnv) envs
    let str = BS.intercalate " " . zipWith (<>) keys $ T.encodeUtf8 . T.pack <$> envVars
    return str

  case connStr of
    Just connStr' -> bracket (mkPool connStr' 8) closePool (run 8080 . app jwtCfg)
    Nothing -> throwIO $ userError "Error getting database connection string"
