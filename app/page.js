'use client'

import React, { useEffect, useState } from 'react';
import { Loader } from 'lucide-react';

const PAYMENT_STATUS = {
    PENDING: 'pending',
    RECEIVED: 'received',
    ERROR: 'error'
};

export default function PaymentChecker() {
    const [status, setStatus] = useState('checking');
    const [error, setError] = useState(null);
    const [attempts, setAttempts] = useState(0);
    const MAX_ATTEMPTS = 60; // 3 minutes with 3-second intervals
    const CHECK_URL = 'https://script.google.com/macros/s/AKfycbzzqLT0lGvm3GMm4GDN-2uuW0-xgXmxsMi3ZbziMN4sV7eUmmJbDrSiGhPHXYQPemZH/exec';

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

        const checkTransaction = async () => {
            try {
                console.log(`Checking transaction (Attempt ${attempts + 1}/${MAX_ATTEMPTS}):`, txId);
                const response = await fetch(`${CHECK_URL}?transactionId=${txId}`);
                const text = await response.text();
                console.log('Response from sheets:', text);
                
                const data = JSON.parse(text);
                console.log('Parsed response:', data);
        
                // Check if we found entries
                if (data.items && data.items.length > 0) {
                    // Find our specific transaction
                    const ourTransaction = data.items.find(item => item.transactionId === txId);
                    
                    if (ourTransaction) {
                        console.log('Found our transaction:', ourTransaction);
                        
                        // Check if payment has been received
                        if (ourTransaction.paymentStatus === PAYMENT_STATUS.RECEIVED) {
                            console.log('Payment confirmed as received');
                            setStatus('success');
                            
                            // Notify parent window
                            if (window.opener) {
                                window.opener.postMessage({
                                    type: 'update-text',
                                    text: 'Payment successful!'
                                }, '*');
                                
                                setTimeout(() => window.close(), 2000);
                            }
                        } else {
                            if (attempts >= MAX_ATTEMPTS) {
                                console.log('Maximum attempts reached without payment confirmation');
                                setError('Payment verification timeout. Please check your transaction status.');
                                setStatus('error');
                            } else {
                                console.log('Payment not yet received, checking again in 3s');
                                setAttempts(prev => prev + 1);
                                setTimeout(checkTransaction, 3000);
                            }
                        }
                    } else {
                        if (attempts >= MAX_ATTEMPTS) {
                            setError('Transaction not found after maximum attempts');
                            setStatus('error');
                        } else {
                            console.log('Transaction ID not found, checking again in 3s');
                            setAttempts(prev => prev + 1);
                            setTimeout(checkTransaction, 3000);
                        }
                    }
                } else {
                    if (attempts >= MAX_ATTEMPTS) {
                        setError('No transactions found after maximum attempts');
                        setStatus('error');
                    } else {
                        console.log('No transactions found, checking again in 3s');
                        setAttempts(prev => prev + 1);
                        setTimeout(checkTransaction, 3000);
                    }
                }
            } catch (error) {
                console.error('Error checking transaction:', error);
                if (attempts >= MAX_ATTEMPTS) {
                    setError('Error verifying payment after maximum attempts');
                    setStatus('error');
                } else {
                    setAttempts(prev => prev + 1);
                    setTimeout(checkTransaction, 3000);
                }
            }
        };

        // Start checking
        checkTransaction();

    }, [attempts]);

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
                            {attempts > 0 && ` (Attempt ${attempts}/${MAX_ATTEMPTS})`}
                        </p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-green-800 text-center">
                            Payment successful! Window closing...
                        </p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-800 text-center">
                            {error || 'An error occurred during verification'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}