export enum PlaidPrimaryTransactionCategory {
  INCOME = "INCOME",
  TRANSFER_IN = "TRANSFER_IN",
  TRANSFER_OUT = "TRANSFER_OUT",
  LOAN_PAYMENTS = "LOAN_PAYMENTS",
  BANK_FEES = "BANK_FEES",
  ENTERTAINMENT = "ENTERTAINMENT",
  FOOD_AND_DRINK = "FOOD_AND_DRINK",
  GENERAL_MERCHANDISE = "GENERAL_MERCHANDISE",
  HOME_IMPROVEMENT = "HOME_IMPROVEMENT",
  MEDICAL = "MEDICAL",
  PERSONAL_CARE = "PERSONAL_CARE",
  GENERAL_SERVICES = "GENERAL_SERVICES",
  GOVERNMENT_AND_NON_PROFIT = "GOVERNMENT_AND_NON_PROFIT",
  TRANSPORTATION = "TRANSPORTATION",
  TRAVEL = "TRAVEL",
  RENT_AND_UTILITIES = "RENT_AND_UTILITIES",
  OTHER = "OTHER",
}

export enum BeanTransactionCategory {
  FOOD = "Food",
  INCOME = "Income",
  UTILITIES = "Utilities",
  SHOPPING = "Shopping",
  TRANSPORTATION = "Transportation",
  ENTERTAINMENT = "Entertainment",
  OTHER = "Other", // Default category for unexpected values
}

export function mapPlaidToBeanTransactionCategory(
  plaidTransactionCategory: PlaidPrimaryTransactionCategory,
): BeanTransactionCategory {
  switch (plaidTransactionCategory) {
    case PlaidPrimaryTransactionCategory.INCOME:
    case PlaidPrimaryTransactionCategory.TRANSFER_IN:
      return BeanTransactionCategory.INCOME;
    case PlaidPrimaryTransactionCategory.FOOD_AND_DRINK:
      return BeanTransactionCategory.FOOD;
    case PlaidPrimaryTransactionCategory.RENT_AND_UTILITIES:
    case PlaidPrimaryTransactionCategory.BANK_FEES:
      return BeanTransactionCategory.UTILITIES;
    case PlaidPrimaryTransactionCategory.GENERAL_MERCHANDISE:
    case PlaidPrimaryTransactionCategory.HOME_IMPROVEMENT:
      return BeanTransactionCategory.SHOPPING;
    case PlaidPrimaryTransactionCategory.TRANSPORTATION:
    case PlaidPrimaryTransactionCategory.TRAVEL:
      return BeanTransactionCategory.TRANSPORTATION;
    case PlaidPrimaryTransactionCategory.ENTERTAINMENT:
      return BeanTransactionCategory.ENTERTAINMENT;
    case PlaidPrimaryTransactionCategory.TRANSFER_OUT:
    case PlaidPrimaryTransactionCategory.LOAN_PAYMENTS:
    case PlaidPrimaryTransactionCategory.MEDICAL:
    case PlaidPrimaryTransactionCategory.PERSONAL_CARE:
    case PlaidPrimaryTransactionCategory.GENERAL_SERVICES:
    case PlaidPrimaryTransactionCategory.GOVERNMENT_AND_NON_PROFIT:
      return BeanTransactionCategory.OTHER;
    default:
      // Handle unexpected strings by returning a default category or throwing an error
      return BeanTransactionCategory.OTHER;
    // Or: throw new Error(`Unexpected CategoryA value: ${categoryA}`);
  }
}
