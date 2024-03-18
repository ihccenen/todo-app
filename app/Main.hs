{-# LANGUAGE DataKinds #-}
{-# LANGUAGE DeriveGeneric #-}
{-# LANGUAGE FlexibleInstances #-}
{-# LANGUAGE ImportQualifiedPost #-}
{-# LANGUAGE MultiParamTypeClasses #-}
{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE TypeOperators #-}

module Main where

import Data.Aeson (FromJSON, ToJSON)
import Data.ByteString.Lazy qualified as Lazy
import Data.Text (Text)
import GHC.Generics (Generic)
import Lucid
import Network.HTTP.Media ((//), (/:))
import Network.Wai.Handler.Warp
import Servant
import Servant.Auth as SA
import Servant.Auth.Server as SAS

newtype AuthenticatedAccount = AuthenticatedAccount {accId :: String} deriving (Generic, Show)

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

type Protected = Auth '[SA.Cookie] AuthenticatedAccount :> Get '[HTML] RawHtml

type Unprotected =
  "login" :> Get '[HTML] RawHtml
    :<|> "signup" :> Get '[HTML] RawHtml

type API = Protected :<|> Unprotected

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
signupPage = renderRawHtml $ baseRender "Signup" $
  form_ $ do
    input "Username:" "text" "username"

    input "Password:" "password" "password"

    input "Confirm Password:" "password" "confirm-password"

    button_ [type_ "submit"] "Submit"

loginPage :: RawHtml
loginPage = renderRawHtml $ baseRender "Login" $
  form_ $ do
    input "Username:" "text" "username"

    input "Password:" "password" "password"

    button_ [type_ "submit"] "Submit"

api :: Proxy API
api = Proxy

protected :: Server Protected
protected (Authenticated _) = return $ RawHtml $ renderBS $ h1_ "Authenticated"
protected _ = return loginSignupPage

unprotected :: Server Unprotected
unprotected = return signupPage :<|> return loginPage

server :: Server API
server = protected :<|> unprotected

app :: Context '[CookieSettings, JWTSettings] -> Application
app cfg = serveWithContext api cfg server

cookieSettings :: CookieSettings
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
      cfg = cookieSettings :. jwtCfg :. EmptyContext
  run 8080 (app cfg)
