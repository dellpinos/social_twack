# Generated by Django 5.1 on 2024-12-08 19:52

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('network', '0004_alter_commentlike_created_at_and_more'),
    ]

    operations = [
        migrations.DeleteModel(
            name='User',
        ),
    ]
