'use client'

import React, { useEffect, useState } from 'react';
import { Loader } from 'lucide-react';

export default function PaymentChecker() {
    const [status, setStatus] = useState('initializing');
    const [error, setError] = useState(null);
    const WRITE_URL = 'https://script.google.com/macros/s/AKfycbxrLoiZmW7Qcd6qu0Vpbr7cpXkiB3y8f-NcOSnkXaRSfYOQyOdJwsr1kj14xvOBY_iK/exec';

    useEffect(() => {
        const init = async () => {
            try {
                const urlParams = new URLSearchParams(window.location.search);
                const txId = urlParams.get('transactionId');
                
                if (!txId) {
                    throw new Error('No transaction ID provided');
                }

                console.log('Writing pending record for transaction:', txId);
                
                const postData = {
                    transactionId: txId,
                    status: 'pending'
                };

                // Make the POST request
                await fetch(WRITE_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(postData)
                });

                console.log('Successfully wrote pending record');
                setStatus('checking');
                
                // Start the normal checking process...
                
            } catch (err) {
                console.error('Error in initialization:', err);
                setError(err.message);
                setStatus('error');
            }
        };

        init();
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
                    Payment Verification
                </h2>

                {status === 'initializing' && (
                    <div className="text-center">
                        <div className="flex justify-center mb-4">
                            <Loader className="w-12 h-12 text-blue-500 animate-spin" />
                        </div>
                        <p className="text-gray-600 font-medium">
                            Initializing...
                        </p>
                    </div>
                )}

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