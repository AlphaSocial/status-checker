'use client'

import React, { useEffect, useState, useCallback } from 'react';
import { Loader } from 'lucide-react';

// Constants
const PAYMENT_STATUS = {
    PENDING: 'pending',
    RECEIVED: 'received',
    ERROR: 'error'
};

const CONFIG = {
    CHECK_URL: 'https://script.google.com/macros/s/AKfycbzzqLT0lGvm3GMm4GDN-2uuW0-xgXmxsMi3ZbziMN4sV7eUmmJbDrSiGhPHXYQPemZH/exec',
    MAX_ATTEMPTS: 60, // 3 minutes with 3-second intervals
    CHECK_INTERVAL: 3000 // 3 seconds
};

export default function PaymentChecker() {
    const [status, setStatus] = useState('checking');
    const [error, setError] = useState(null);
    const [attempts, setAttempts] = useState(0);
    const [transactionId, setTransactionId] = useState(null);

    const checkTransaction = useCallback(async (txId) => {
        try {
            if (attempts >= CONFIG.MAX_ATTEMPTS) {
                console.log('Maximum attempts reached');
                setError('Payment verification timeout. Please check your transaction status.');
                setStatus('error');
                return;
            }

            console.log(`Checking transaction (Attempt ${attempts + 1}/${CONFIG.MAX_ATTEMPTS}):`, txId);
            
            const response = await fetch(`${CONFIG.CHECK_URL}?transactionId=${txId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const text = await response.text();
            console.log('Response from sheets:', text);
            
            let data;
            try {
                data = JSON.parse(text);
            } catch (parseError) {
                console.error('Error parsing response:', parseError);
                throw new Error('Invalid response format');
            }
            
            console.log('Parsed response:', data);
    
            if (!data.items || !Array.isArray(data.items)) {
                throw new Error('Invalid data structure');
            }

            const transaction = data.items.find(item => item.transactionId === txId);
            
            if (transaction) {
                console.log('Found transaction:', transaction);
                
                // Validate payment status
                if (!transaction.paymentStatus) {
                    console.log('Payment status not found, treating as pending');
                    scheduleNextCheck(txId);
                    return;
                }
                
                if (transaction.paymentStatus === PAYMENT_STATUS.RECEIVED) {
                    console.log('Payment confirmed as received');
                    handlePaymentSuccess(txId);
                } else if (transaction.paymentStatus === PAYMENT_STATUS.ERROR) {
                    console.log('Payment error detected');
                    setError('Payment processing error. Please try again.');
                    setStatus('error');
                } else {
                    console.log('Payment still pending');
                    scheduleNextCheck(txId);
                }
            } else {
                console.log('Transaction not found');
                scheduleNextCheck(txId);
            }
        } catch (error) {
            console.error('Error checking transaction:', error);
            scheduleNextCheck(txId);
        }
    }, [attempts]);

    const scheduleNextCheck = useCallback((txId) => {
        setAttempts(prev => prev + 1);
        setTimeout(() => checkTransaction(txId), CONFIG.CHECK_INTERVAL);
    }, [checkTransaction]);

    const handlePaymentSuccess = useCallback((txId) => {
        setStatus('success');
        
        if (window.opener) {
            // Notify parent window
            window.opener.postMessage({
                type: 'update-text',
                text: 'Payment successful!',
                transactionId: txId,
                paymentStatus: PAYMENT_STATUS.RECEIVED
            }, '*');
            
            // Close window after delay
            setTimeout(() => window.close(), 2000);
        }
    }, []);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const txId = urlParams.get('transactionId');
        
        console.log('Status Checker - Transaction ID:', txId);
        
        if (!txId) {
            console.error('No transaction ID provided in URL');
            setError('No transaction ID provided');
            setStatus('error');
            return;
        }

        setTransactionId(txId);
        checkTransaction(txId);

        // Cleanup function
        return () => {
            // Clear any pending timeouts
            const id = setTimeout(() => {}, 0);
            while (id--) {
                clearTimeout(id);
            }
        };
    }, [checkTransaction]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
                    Payment Verification
                </h2>

                {status === 'checking' && (
                    <div className="text-center">
                        <div className="flex justify-center mb-4">
                            <Loader className="w-12 h-12 text-blue-500 animate-spin" />
                        </div>
                        <p className="text-gray-600 font-medium">
                            Verifying your payment...
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                            Please keep this window open while we confirm your payment
                            {attempts > 0 && ` (Attempt ${attempts}/${CONFIG.MAX_ATTEMPTS})`}
                        </p>
                        {attempts > 10 && (
                            <p className="text-sm text-amber-600 mt-4">
                                This is taking longer than usual. Please be patient...
                            </p>
                        )}
                    </div>
                )}

                {status === 'success' && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-green-800 text-center font-medium">
                            Payment successful!
                        </p>
                        <p className="text-green-600 text-center text-sm mt-2">
                            Window closing...
                        </p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-800 text-center font-medium">
                            {error || 'An error occurred during verification'}
                        </p>
                        <p className="text-red-600 text-center text-sm mt-2">
                            Please try refreshing or contact support if the issue persists.
                        </p>
                        <div className="mt-4 text-center">
                            <button
                                onClick={() => window.location.reload()}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                            >
                                Retry Verification
                            </button>
                        </div>
                    </div>
                )}

                {transactionId && (
                    <div className="mt-4 text-center">
                        <p className="text-xs text-gray-500">
                            Transaction ID: {transactionId}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}