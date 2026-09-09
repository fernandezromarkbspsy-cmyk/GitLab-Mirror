export interface SeatalkEmployee {
  employee_code: string;
  avatar?: string;
  name: string;
  email: string;
  mobile?: string;
}

export interface SeatalkLoginTransaction {
  loginUrl: string;
  transactionId: string;
  transactionToken: string;
}

export interface SeatalkTransactionResult {
  status: 'pending' | 'failed' | 'complete';
  employee?: SeatalkEmployee;
  sessionUrl?: string;
  message?: string;
}

export async function createSeatalkLoginTransaction(): Promise<SeatalkLoginTransaction> {
  const response = await fetch('/api/auth/seatalk/transactions', { method: 'POST' });
  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Unable to initialize SeaTalk login.');
  }

  return {
    loginUrl: data.login_url,
    transactionId: data.transaction_id,
    transactionToken: data.transaction_token,
  };
}

export async function getSeatalkTransactionResult(
  transactionId: string,
  transactionToken: string,
): Promise<SeatalkTransactionResult> {
  const response = await fetch(`/api/auth/seatalk/transactions/${encodeURIComponent(transactionId)}`, {
    headers: { 'X-Seatalk-Transaction': transactionToken },
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'SeaTalk login transaction expired.');
  }

  return {
    status: data.status,
    employee: data.employee,
    sessionUrl: data.session_url,
    message: data.message,
  };
}
