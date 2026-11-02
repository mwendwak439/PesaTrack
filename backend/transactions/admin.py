from django.contrib import admin
from .models import Transaction, Investment, InvestmentActivity

admin.site.register(Transaction)

admin.site.register(Investment)
admin.site.register(InvestmentActivity)