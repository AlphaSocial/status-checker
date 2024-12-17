'use client'

import React, { useEffect, useState } from 'react';
import { Loader } from 'lucide-react';

export default function PaymentChecker() {
    const [status, setStatus] = useState('checking');
    const [error, setError] = useState(null);
    const WRITE_URL = 'https://script.google.com/macros/s/AKfycbxQ0d0oY0PifhhlAUcWcWEdQnF_mIaXwSpBEqSo0KeWdbEOVmlJfaTBw0QK6Vht2sEt/exec';
    const CHECK_URL = 'https://script.google.com/macros/s/AKfycbzzqLT0lGvm3GMm4GDN-2uuW0-xgXmxsMi3ZbziMN4sV7eUmmJbDrSiGhPHXYQPemZH/exec';

    useEffect(() => {
        const createPendingRecord = async () => {
            try {
                const urlParams = new URLSearchParams(window.location.search);
                const txId = urlParams.get('transactionId');

                if (!txId) {
                    throw new Error('No transaction ID provided');
                }

                console.log('Recording pending transaction:', {
                    transactionId: txId,
                    network: 'pending',
                    currency: 'pending',
                    signature: '',
                    amount: ''
                });

                await fetch(WRITE_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        transactionId: txId,
                        network: 'pending',
                        currency: 'pending',
                        signature: '',
                        amount: ''
                    })
                });

                console.log('Pending record created in sheets');
                startChecking(txId);
            } catch (error) {
                console.error('Error creating pending record:', error);
                setError(error.message);
                setStatus('error');
            }
        };

        const startChecking = async (txId) => {
            try {
                const response = await fetch(`${CHECK_URL}?transactionId=${txId}`);
                const data = await response.json();

                if (data.found === true) {
                    setStatus('success');
                    if (window.opener) {
                        window.opener.postMessage({
                            type: 'update-text',
                            text: 'Payment successful!'
                        }, '*');
                        setTimeout(() => window.close(), 2000);
                    }
                } else {
                    setTimeout(() => startChecking(txId), 3000);
                }
            } catch (error) {
                console.error('Error checking transaction:', error);
                setTimeout(() => startChecking(txId), 3000);
            }
        };

        createPendingRecord();
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