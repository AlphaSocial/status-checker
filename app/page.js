'use client'

import React, { useEffect, useState } from 'react';
import { Loader } from 'lucide-react';

export default function PaymentChecker() {
    const [status, setStatus] = useState('checking');
    const [error, setError] = useState(null);
    const SCRIPT_URL = process.env.NEXT_PUBLIC_DATA_SCRIPT_URL;

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const txId = urlParams.get('transactionId');
        
        if (!txId) {
            setError('No transaction ID provided');
            setStatus('error');
            return;
        }

        const checkTransaction = async () => {
            try {
                const response = await fetch(`${SCRIPT_URL}?transactionId=${txId}`);
                const text = await response.text();
                const data = JSON.parse(text);

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
                    setTimeout(checkTransaction, 3000);
                }
            } catch (error) {
                console.error('Transaction check error:', error);
                setTimeout(checkTransaction, 3000);
            }
        };

        checkTransaction();
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center bg-yellow-300 p-4">
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