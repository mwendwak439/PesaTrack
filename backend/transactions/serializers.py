from rest_framework import serializers
from  .models import Transaction, Investment, InvestmentActivity
class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = [
            'id',
            'title',
            'transaction_type',
            'category',
            'amount',
            'description',
            'date',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "Amount must be greater than zero."
            )

        return value

class InvestmentSerializer(serializers.ModelSerializer):

    profit_or_loss = serializers.ReadOnlyField()

    class Meta:
        model = Investment
        fields = [
            'id',
            'name',
            'investment_type',
            'amount_invested',
            'current_value',
            'description',
            'date',
            'profit_or_loss',
            'created_at',
        ]

        read_only_fields = [
            'id',
            'amount_invested',
            'current_value',
            'profit_or_loss',
            'created_at',
        ]


class InvestmentActivitySerializer(serializers.ModelSerializer):

    class Meta:
        model = InvestmentActivity
        fields = [
            'id',
            'investment',
            'activity_type',
            'amount',
            'date',
            'created_at',
        ]

        read_only_fields = ['id', 'created_at']