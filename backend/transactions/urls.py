
from django.urls import path
from .views import TransactionListCreateView, TransactionDetailView,  WalletBalanceView,InvestmentListCreateView,InvestmentDepositView,InvestmentWithdrawView, PortfolioRateView,InvestmentHistoryView
from .auth_views import RegisterView,LoginView, LogoutView, csrf_token_view, current_user

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('csrf/', csrf_token_view, name='csrf-token'),
    path('transactions/', TransactionListCreateView.as_view(), name='transaction-list-create'),
    path('transactions/<int:pk>/', TransactionDetailView.as_view(), name='transaction-detail'),
    path('me/', current_user, name='current-user'),

    path('wallet/', WalletBalanceView.as_view(), name='wallet-balance'),

    path('investments/', InvestmentListCreateView.as_view(), name='investment-list-create'),
    path('investments/<int:pk>/deposit/', InvestmentDepositView.as_view(), name='investment-deposit'),
    path('investments/<int:pk>/withdraw/', InvestmentWithdrawView.as_view(), name='investment-withdraw'),
    path(
    'portfolio/rate/',
    PortfolioRateView.as_view(),
    name='portfolio-rate'
),
path(
    'investments/<int:pk>/history/',
    InvestmentHistoryView.as_view(),
    name='investment-history'
)
]
