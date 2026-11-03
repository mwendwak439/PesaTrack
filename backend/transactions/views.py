
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP

from django.db import transaction
from django.db.models import Sum, Q
from django.utils import timezone

from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import Transaction, Investment, InvestmentActivity, InvestmentValueHistory
from .serializers import TransactionSerializer, InvestmentSerializer
from datetime import timedelta

# --------------------------------
# WALLET BALANCE
# --------------------------------

def get_wallet_balance(user):
    totals = Transaction.objects.filter(user=user).aggregate(
        income=Sum('amount', filter=Q(transaction_type='Income')),
        expenses=Sum('amount', filter=Q(transaction_type='Expense')),
    )

    income = totals['income'] or Decimal('0.00')
    expenses = totals['expenses'] or Decimal('0.00')

    activity_totals = InvestmentActivity.objects.filter(
        investment__user=user
    ).aggregate(
        deposits=Sum('amount', filter=Q(activity_type='Deposit')),
        withdrawals=Sum('amount', filter=Q(activity_type='Withdrawal'))
    )

    deposits = activity_totals['deposits'] or Decimal('0.00')
    withdrawals = activity_totals['withdrawals'] or Decimal('0.00')

    return income - expenses - deposits + withdrawals


# --------------------------------
# TRANSACTION VIEWS
# --------------------------------

class TransactionListCreateView(generics.ListCreateAPIView):
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Transaction.objects.filter(
            user=self.request.user
        ).order_by('-date')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class TransactionDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Transaction.objects.filter(
            user=self.request.user
        )


# --------------------------------
# WALLET VIEW
# --------------------------------

class WalletBalanceView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        balance = get_wallet_balance(request.user)

        return Response({
            'wallet_balance': str(balance)
        })


# --------------------------------
# INVESTMENT LIST AND CREATE
# --------------------------------

class InvestmentListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        update_investment_growth(request.user)

        investments = Investment.objects.filter(
            user=request.user
        ).order_by('-created_at')

        serializer = InvestmentSerializer(investments, many=True)
        return Response(serializer.data)
    
    
    def post(self, request):
        # Get the amount entered by the user
        try:
            amount = Decimal(str(request.data.get('amount', '')))
        except (InvalidOperation, TypeError, ValueError):
            return Response(
                {'error': 'Please enter a valid investment amount.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate the amount
        if not amount.is_finite() or amount <= 0:
            return Response(
                {'error': 'Investment amount must be greater than zero.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if amount != amount.quantize(Decimal('0.01')):
            return Response(
                {'error': 'Investment amount cannot have more than two decimal places.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():

            # Find the user's existing investment account
            investment = Investment.objects.select_for_update().filter(
                user=request.user
            ).order_by('created_at').first()

            # Create the default account if one does not exist
            if investment is None:
                investment = Investment.objects.create(
                    user=request.user,
                    name='PesaTrack Investment Account',
                    investment_type='Other',
                    amount_invested=Decimal('0.00'),
                    current_value=Decimal('0.00'),
                    date=timezone.localdate()
                )

            # Check the user's available wallet balance
            wallet_balance = get_wallet_balance(request.user)

            if amount > wallet_balance:
                return Response(
                    {'error': 'Insufficient wallet balance.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Add money to the investment account
            investment.amount_invested += amount
            investment.current_value += amount
            investment.save()

            # Record the deposit
            InvestmentActivity.objects.create(
                investment=investment,
                activity_type='Deposit',
                amount=amount,
                date=timezone.localdate()
            )

        return Response({
            'message': 'Investment deposit successful.',
            'wallet_balance': str(get_wallet_balance(request.user)),
            'investment': InvestmentSerializer(investment).data
        }, status=status.HTTP_200_OK)


# --------------------------------
# DEPOSIT INTO AN INVESTMENT
# --------------------------------

class InvestmentDepositView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            amount = Decimal(str(request.data.get('amount', '')))
        except (InvalidOperation, TypeError, ValueError):
            return Response(
                {'error': 'Enter a valid deposit amount.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not amount.is_finite() or amount <= 0:
            return Response(
                {'error': 'Deposit amount must be greater than zero.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            investment = Investment.objects.select_for_update().filter(
                pk=pk,
                user=request.user
            ).first()

            if investment is None:
                return Response(
                    {'error': 'Investment not found.'},
                    status=status.HTTP_404_NOT_FOUND
                )

            wallet_balance = get_wallet_balance(request.user)

            if amount > wallet_balance:
                return Response(
                    {'error': 'Insufficient wallet balance.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            investment.amount_invested += amount
            investment.current_value += amount
            investment.save()

            InvestmentActivity.objects.create(
                investment=investment,
                activity_type='Deposit',
                amount=amount,
                date=timezone.localdate()
            )

        return Response({
            'message': 'Deposit successful.',
            'wallet_balance': str(get_wallet_balance(request.user)),
            'investment': InvestmentSerializer(investment).data
        })


# --------------------------------
# WITHDRAW FROM AN INVESTMENT
# --------------------------------

class InvestmentWithdrawView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            amount = Decimal(str(request.data.get('amount', '')))
        except (InvalidOperation, TypeError, ValueError):
            return Response(
                {'error': 'Enter a valid withdrawal amount.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not amount.is_finite() or amount <= 0:
            return Response(
                {'error': 'Withdrawal amount must be greater than zero.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            investment = Investment.objects.select_for_update().filter(
                pk=pk,
                user=request.user
            ).first()

            if investment is None:
                return Response(
                    {'error': 'Investment not found.'},
                    status=status.HTTP_404_NOT_FOUND
                )

            if amount > investment.current_value:
                return Response(
                    {'error': 'You cannot withdraw more than the current investment value.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if amount == investment.current_value:
                investment.amount_invested = Decimal('0.00')
                investment.current_value = Decimal('0.00')
            else:
                principal_reduction = (
                    investment.amount_invested * amount
                    / investment.current_value
                ).quantize(
                    Decimal('0.01'),
                    rounding=ROUND_HALF_UP
                )

                investment.amount_invested -= principal_reduction
                investment.current_value -= amount

            investment.save()

            InvestmentActivity.objects.create(
                investment=investment,
                activity_type='Withdrawal',
                amount=amount,
                date=timezone.localdate()
            )

        return Response({
            'message': 'Withdrawal successful.',
            'wallet_balance': str(get_wallet_balance(request.user)),
            'investment': InvestmentSerializer(investment).data
        })
def get_portfolio_rate(user):
    total_invested = Investment.objects.filter(
        user=user
    ).aggregate(
        total=Sum('amount_invested')
    )['total'] or Decimal('0.00')

    if total_invested >= Decimal('50000'):
        rate = Decimal('0.12')
    elif total_invested >= Decimal('20000'):
        rate = Decimal('0.10')
    elif total_invested >= Decimal('10000'):
        rate = Decimal('0.08')
    elif total_invested >= Decimal('5000'):
        rate = Decimal('0.06')
    elif total_invested > Decimal('0'):
        rate = Decimal('0.05')
    else:
        rate = Decimal('0.00')

    return {
        'total_invested': total_invested,
        'annual_rate': rate,
        'annual_rate_percentage': rate * 100
    }

class PortfolioRateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        portfolio = get_portfolio_rate(request.user)

        total_invested = portfolio['total_invested']
        annual_rate = portfolio['annual_rate']

        annual_growth = total_invested * annual_rate
        monthly_growth = annual_growth / Decimal('12')

        return Response({
            'total_invested': str(total_invested),
            'annual_rate_percentage': str(
                portfolio['annual_rate_percentage']
            ),
            'estimated_annual_growth': str(
                annual_growth.quantize(Decimal('0.01'))
            ),
            'estimated_monthly_growth': str(
                monthly_growth.quantize(Decimal('0.01'))
            )
        })

def update_investment_growth(user):
    today = timezone.localdate()
    portfolio = get_portfolio_rate(user)
    annual_rate = portfolio['annual_rate']

    investments = Investment.objects.filter(user=user)

    with transaction.atomic():
        for investment in investments.select_for_update():

            # First update: record the starting value.
            if investment.last_growth_date is None:
                investment.last_growth_date = today
                investment.save(update_fields=['last_growth_date'])

                InvestmentValueHistory.objects.create(
                    investment=investment,
                    value=investment.current_value,
                    date=today
                )
                continue

            days_passed = (
                today - investment.last_growth_date
            ).days

            if days_passed <= 0:
                continue

            daily_growth = (
                investment.amount_invested
                * annual_rate
                * Decimal(days_passed)
                / Decimal('365')
            )

            daily_growth = daily_growth.quantize(
                Decimal('0.01'),
                rounding=ROUND_HALF_UP
            )

            investment.current_value += daily_growth
            investment.last_growth_date = today

            investment.save(
                update_fields=['current_value', 'last_growth_date']
            )

            InvestmentValueHistory.objects.create(
                investment=investment,
                value=investment.current_value,
                date=today
            )

class InvestmentHistoryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        # Update growth before retrieving history
        update_investment_growth(request.user)

        investment = Investment.objects.filter(
            id=pk,
            user=request.user
        ).first()

        if investment is None:
            return Response(
                {'error': 'Investment not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        history = investment.value_history.order_by('date')

        data = [
            {
                'date': item.date,
                'value': str(item.value)
            }
            for item in history
        ]

        return Response({
            'investment_name': investment.name,
            'history': data
        })
