'use client'

import React, { useEffect, useState } from 'react';
import { Loader } from 'lucide-react';

export default function PaymentChecker() {
    const [status, setStatus] = useState('checking');
    const [error, setError] = useState(null);
    const CHECK_URL = 'https://script.google.com/macros/s/AKfycbzzqLT0lGvm3GMm4GDN-2uuW0-xgXmxsMi3ZbziMN4sV7eUmmJbDrSiGhPHXYQPemZH/exec';

    useEffect(() => {
        let timeoutId;
        let attemptCount = 0;
        const urlParams = new URLSearchParams(window.location.search);
        const txId = urlParams.get('transactionId');
        
        if (!txId) {
            setError('No transaction ID provided');
            setStatus('error');
            return;
        }

        function checkTransaction() {
            fetch(`${CHECK_URL}?transactionId=${txId}`)
                .then(response => response.text())
                .then(text => JSON.parse(text))
                .then(data => {
                    if (data.items && data.items.length > 0) {
                        const ourTransaction = data.items.find(item => item.transactionId === txId);
                        
                        if (ourTransaction && ourTransaction.paymentStatus === 'received') {
                            setStatus('success');
                            
                            if (window.opener) {
                                window.opener.postMessage({
                                    type: 'update-text',
                                    text: 'Payment successful!'
                                }, '*');
                                
                                setTimeout(() => window.close(), 2000);
                            }
                        } else if (attemptCount < 60) {
                            attemptCount++;
                            timeoutId = setTimeout(checkTransaction, 3000);
                        } else {
                            setError('Payment verification timeout');
                            setStatus('error');
                        }
                    } else if (attemptCount < 60) {
                        attemptCount++;
                        timeoutId = setTimeout(checkTransaction, 3000);
                    } else {
                        setError('Payment verification timeout');
                        setStatus('error');
                    }
                })
                .catch(error => {
                    console.error('Error checking transaction:', error);
                    if (attemptCount < 60) {
                        attemptCount++;
                        timeoutId = setTimeout(checkTransaction, 3000);
                    } else {
                        setError('Payment verification error');
                        setStatus('error');
                    }
                });
        }

        checkTransaction();

        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, []);

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
                            Please keep this window open
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