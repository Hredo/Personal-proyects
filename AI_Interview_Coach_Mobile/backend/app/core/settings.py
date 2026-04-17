from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    app_name: str = "AI Interview Coach API"
    gemini_api_key: str = ""
    gemini_model: str = "gemini-1.5-flash"


settings = Settings()
