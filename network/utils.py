from django.utils import timezone
from datetime import timedelta

# Dates Helpers

# I've commented out this code because the specification says 'date and time.' 
# This code allowed a date in the 'human-readable difference' format.


def is_edited(created_at, updated_at):
    # Define a tolerance window in seconds, for example, 1 second
    tolerance = timedelta(seconds=1)
    return abs(created_at - updated_at) > tolerance

def custom_timesince(created_at):
    now = timezone.now()
    diff = now - created_at

    if diff < timedelta(minutes=1):
        return "just now"
    elif diff < timedelta(hours=1):
        minutes = int(diff.total_seconds() / 60)
        return f"{minutes} minute{'s' if minutes > 1 else ''} ago"
    elif diff < timedelta(days=1):
        hours = int(diff.total_seconds() / 3600)
        return f"{hours} hour{'s' if hours > 1 else ''} ago"
    else:
        days = int(diff.total_seconds() / 86400)
        return f"{days} day{'s' if days > 1 else ''} ago"