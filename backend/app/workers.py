from app.logger import get_logger
from drylib import repeat_every

logger = get_logger(__name__)


@repeat_every(seconds=60, max_repetitions=0)
async def run_scheduler():
    logger.info("Running scheduler...")
    # do some work here
    pass
