from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class Transaction(models.Model):

    TRANSACTION_TYPES = [
        ('Income', 'Income'),
        ('Expense', 'Expense'),
    ]

    CATEGORIES = [
        ('Salary', 'Salary'),
        ('Business', 'Business'),
        ('Food', 'Food'),
        ('Transport', 'Transport'),
        ('Rent', 'Rent'),
        ('Shopping', 'Shopping'),
        ('Bills', 'Bills'),
        ('Health', 'Health'),
        ('Education', 'Education'),
        ('Entertainment', 'Entertainment'),
        ('Fitness', 'Fitness'),
        ('Other', 'Other'),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='transactions'
    )

    title = models.CharField(max_length=200)

    transaction_type = models.CharField(
        max_length=10,
        choices=TRANSACTION_TYPES
    )

    category = models.CharField(
        max_length=20,
        choices=CATEGORIES,
        default='Other'
    )

    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    description = models.TextField(blank=True)

    date = models.DateField()

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.transaction_type} - {self.amount}"


class Investment(models.Model):

    INVESTMENT_TYPES = [
        ('Money Market Fund', 'Money Market Fund'),
        ('Treasury Bills', 'Treasury Bills'),
        ('Stocks', 'Stocks'),
        ('Bonds', 'Bonds'),
        ('Other', 'Other'),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='investments'
    )

    name = models.CharField(max_length=150)

    investment_type = models.CharField(
        max_length=30,
        choices=INVESTMENT_TYPES,
        default='Other'
    )

    amount_invested = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    current_value = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    description = models.TextField(blank=True)

    date = models.DateField()


    last_growth_date = models.DateField(
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    @property
    def profit_or_loss(self):
        return self.current_value - self.amount_invested

 
    
    
class InvestmentActivity(models.Model):

    ACTIVITY_TYPES = [
        ('Deposit', 'Deposit'),
        ('Withdrawal', 'Withdrawal'),
    ]

    investment = models.ForeignKey(
        Investment,
        on_delete=models.CASCADE,
        related_name='activities'
    )

    activity_type = models.CharField(
        max_length=20,
        choices=ACTIVITY_TYPES
    )

    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    date = models.DateField()

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.activity_type} - {self.amount}"

class InvestmentValueHistory(models.Model):

    investment = models.ForeignKey(
        Investment,
        on_delete=models.CASCADE,
        related_name='value_history'
    )

    value = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    date = models.DateField()

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.investment.name} - {self.value} - {self.date}"

class PortfolioValueHistory(models.Model):

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='portfolio_value_history'
    )

    value = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.value}"