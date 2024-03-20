{-# LANGUAGE DataKinds #-}
{-# LANGUAGE DeriveGeneric #-}
{-# LANGUAGE FlexibleInstances #-}
{-# LANGUAGE ImportQualifiedPost #-}
{-# LANGUAGE MultiParamTypeClasses #-}
{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE TypeOperators #-}

module Main where

import Control.Monad.IO.Class (liftIO)
import Data.Aeson (FromJSON, ToJSON)
import Data.ByteString.Lazy qualified as Lazy
import Data.Text (Text)
import GHC.Generics (Generic)
import Lucid
import Lucid.Base (makeAttribute)
import Network.HTTP.Media ((//), (/:))
import Network.Wai.Handler.Warp (run)
import Servant
import Servant.Auth.Server
import Web.FormUrlEncoded (FromForm)

data Account = Account
  { username :: Text
  , password :: Text
  }
  deriving (Generic, Show)

instance FromForm Account

newtype AuthenticatedAccount = AuthenticatedAccount {accId :: Int} deriving (Generic, Show)

instance ToJSON AuthenticatedAccount

instance ToJWT AuthenticatedAccount

instance FromJSON AuthenticatedAccount

instance FromJWT AuthenticatedAccount

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

type Protected = Auth '[Cookie] AuthenticatedAccount :> Get '[HTML] RawHtml

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

hyperscript_ :: Text -> Attribute
hyperscript_ = makeAttribute "_"

hxPost_ :: Text -> Attribute
hxPost_ = makeAttribute "hx-post"

baseRender :: (Monad m) => Text -> HtmlT m a -> HtmlT m a
baseRender title innerHtml = do
  doctype_

  html_ [lang_ "en"] ""

  head_ $ do
    meta_ [charset_ "utf-8"]

    meta_ [name_ "viewport", content_ "width=device-width, initial-scale=1.0"]

    script_ [src_ "https://cdn.tailwindcss.com"] ("" :: String)

    script_ [src_ "https://unpkg.com/htmx.org@1.9.11"] ("" :: String)

    script_ [src_ "https://unpkg.com/hyperscript.org@0.9.12"] ("" :: String)

    title_ (toHtml title)

  body_ innerHtml

renderRawHtml :: Html a -> RawHtml
renderRawHtml = RawHtml . renderBS

loginSignupPage :: RawHtml
loginSignupPage = renderRawHtml $ baseRender "Homepage" $ div_ $ do
  a_ [href_ "/login"] "Login"
  a_ [href_ "/signup"] "Signup"

input :: Text -> Text -> Text -> Html ()
input lbl typ name = div_ $ do
  label_ [for_ name] $ toHtml lbl
  input_ [type_ typ, name_ name, id_ name, required_ "true"]

signupPage :: RawHtml
signupPage = renderRawHtml
  $ baseRender "Signup"
  $ form_
    [ hxPost_ "/signup"
    , hyperscript_
        "on htmx:afterOnLoad\
        \  if event.detail.successful\
        \    set #error.innerHTML to '\160'\
        \    go to url '/'\
        \  else if event.detail.xhr.status is 401\
        \    set #error.innerHTML to event.detail.xhr.responseText\
        \  else\
        \    set #error.innerHTML to 'Server error'"
    ]
  $ do
    div_ $ do
      span_ [id_ "error"] "\160"

    input "Username:" "text" "username"

    input "Password:" "password" "password"

    input "Confirm Password:" "password" "confirm-password"

    button_
      [ type_ "submit"
      , hyperscript_
          "on keyup from closest <form/>\
          \   if #password.value is not #confirm-password.value\
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
    [ hxPost_ "/login"
    , hyperscript_
        "on htmx:afterOnLoad\
        \  if event.detail.successful\
        \    set #error.innerHTML to '\160'\
        \    go to url '/'\
        \  else if event.detail.xhr.status is 401\
        \    set #error.innerHTML to event.detail.xhr.responseText\
        \  else\
        \    set #error.innerHTML to 'Server error'"
    ]
  $ do
    div_ $ do
      span_ [id_ "error"] "\160"

    input "Username:" "text" "username"

    input "Password:" "password" "password"

    button_ [type_ "submit"] "Submit"

api :: Proxy API
api = Proxy

protected :: Server Protected
protected (Authenticated _) = return $ RawHtml $ renderBS $ h1_ "Authenticated"
protected _ = return loginSignupPage

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

db :: [(Text, Account)]
db = [("user", Account "user" "pass")]

unprotected :: CookieSettings -> JWTSettings -> Server Unprotected
unprotected cs jwts = signup :<|> login
  where
    signup :: Handler RawHtml :<|> (Account -> Handler (AcceptHeaders NoContent))
    signup = return signupPage :<|> signup'

    signup' :: Account -> Handler (AcceptHeaders NoContent)
    signup' (Account username' _) = do
      case lookup username' db of
        Just _ -> throwError $ err401 {errBody = "Username already exists"}
        Nothing -> getAuthenticatedCookies cs jwts (AuthenticatedAccount 0)

    login :: Handler RawHtml :<|> (Account -> Handler (AcceptHeaders NoContent))
    login = return loginPage :<|> login'

    login' :: Account -> Handler (AcceptHeaders NoContent)
    login' (Account username' pass) = do
      case lookup username' db of
        Just (Account _ pass') ->
          if pass == pass'
            then getAuthenticatedCookies cs jwts (AuthenticatedAccount 0)
            else throwError $ err401 {errBody = "Wrong username or password"}
        Nothing -> throwError $ err401 {errBody = "Wrong username or password"}

server :: CookieSettings -> JWTSettings -> Server API
server cs jwts = protected :<|> unprotected cs jwts

app :: JWTSettings -> Application
app jwts = serveWithContext api cfg (server cookieSettings jwts)
  where
    cfg = cookieSettings :. jwts :. EmptyContext
    cookieSettings =
      defaultCookieSettings
        { cookieIsSecure = NotSecure
        , cookieSameSite = SameSiteStrict
        , cookieXsrfSetting = Nothing
        }

main :: IO ()
main = do
  myKey <- generateKey

  let jwtCfg = defaultJWTSettings myKey

  run 8080 (app jwtCfg)
