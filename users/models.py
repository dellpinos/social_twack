from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    # max_prod_capacity = models.IntegerField(default = 3)
    deleted_at = models.DateTimeField(null = True, blank = True)

    def __str__(self):
        return f"Id: {self.id} - Username: {self.username}, Email: {self.email}"
    
# class SellerTimeOff(models.Model):
#     user = models.ForeignKey(User, on_delete = models.CASCADE, related_name = 'days_off')
#     date = models.DateField()

#     def serialize(self):
#         return {
#             "user": self.user.username,
#             "date": self.date
#         }
    
#     def __str__(self):
#         return f"The user: {self.user} is free on date: {self.date}"
    
# class Notification(models.Model):
    
#     NOTIFICATION_TYPES = [
#         ('order', 'Order Notification'),
#         ('product', 'Product Notification'),
#         ('message', 'Message Notification'),
#     ]

#     user = models.ForeignKey(User, on_delete = models.CASCADE, related_name = "notifications")
#     notification_type = models.CharField(max_length = 50, choices = NOTIFICATION_TYPES)
#     message = models.TextField()
#     is_read = models.BooleanField(default=False)
#     created_at = models.DateTimeField(auto_now_add=True)

#     def serialize(self):
#         return {
#             "user": self.user.username,
#             "notification_type": self.notification_type,
#             "message": self.message,
#             "is_read": self.is_read,
#             "created_at": self.created_at,
#             "id": self.id
#         }
    
#     def __str__(self):
#         return f"{self.user.username}: {self.message}"