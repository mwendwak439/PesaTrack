
from django.urls import path
from .views import TransactionListCreateView, TransactionDetailView
from .auth_views import RegisterView,LoginView, LogoutView, csrf_token_view

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('csrf/', csrf_token_view, name='csrf-token'),
    path('transactions/', TransactionListCreateView.as_view(), name='transaction-list-create'),
    path('transactions/<int:pk>/', TransactionDetailView.as_view(), name='transaction-detail'),
]
