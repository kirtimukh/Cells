import logging
from logging.config import dictConfig


class DevConfig:
    LOGGER_NAME: str = "devLogger"
    LOG_FORMAT: str = "%(service)s | %(asctime)s | %(message)s"
    LOG_LEVEL: str = "DEBUG"
    DATE_FORMAT: str = "%Y-%m-%d %H:%M:%S"


dictConfig(
    {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "default": {
                "()": "uvicorn.logging.DefaultFormatter",
                "fmt": DevConfig.LOG_FORMAT,
                "datefmt": DevConfig.DATE_FORMAT,
            }
        },
        "handlers": {
            "default": {
                "class": "logging.StreamHandler",
                "stream": "ext://sys.stdout",
                "formatter": "default",
            }
        },
        "loggers": {
            DevConfig.LOGGER_NAME: {
                "handlers": ["default"],
                "level": DevConfig.LOG_LEVEL,
            },
        },
    }
)


def get_logger(service_name="default"):
    stdlogger = logging.getLogger(DevConfig.LOGGER_NAME)
    NAME_LENGTH = 12
    if len(service_name) <= NAME_LENGTH:
        diff = NAME_LENGTH - len(service_name)
        service_name = f"{service_name}{' ' * diff}"
    logger = logging.LoggerAdapter(stdlogger, {"service": service_name})
    return logger
