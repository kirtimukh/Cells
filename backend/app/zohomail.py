import json

import smtplib
from email.mime.text import MIMEText
# from email.message import EmailMessage

from app.config import Config as AppConfig
from app.logger import get_logger


logger = get_logger(__name__)


def send_email(mail_subject, mail_text, recipient, retry=0):
    if retry > 3:
        logger.error(f"Failed to send email after {retry} retries")
        return

    msg = MIMEText(mail_text)
    msg["Subject"] = mail_subject
    msg["From"] = AppConfig.EMAIL_FROM
    msg["To"] = recipient
    # msg.set_content(mail_text)

    try:
        with smtplib.SMTP_SSL('smtppro.zoho.in', 465) as smtp:
            print(AppConfig.EMAIL_FROM, AppConfig.EMAIL_PASS)
            smtp.login(AppConfig.EMAIL_FROM, AppConfig.EMAIL_PASS)
            smtp.sendmail(AppConfig.EMAIL_FROM, recipient, msg.as_string())
            logger.info(f"Verification email sent: {recipient}")

    except smtplib.SMTPServerDisconnected:
        logger.info(f"SMTPServerDisconnected: Reconnecting {retry}")
        send_email(mail_subject, mail_text, recipient, retry=retry + 1)

    except smtplib.SMTPSenderRefused:
        logger.info(f"SMTPSenderRefused: Reconnecting {retry}")
        send_email(mail_subject, mail_text, recipient, retry=retry + 1)

    except smtplib.SMTPRecipientsRefused:
        logger.error(f"[Failed] smtplib.SMTPRecipientsRefused")

    except smtplib.SMTPAuthenticationError as e:
        print(e)
        logger.error(f"[Failed] smtplib.SMTPAuthenticationError")
