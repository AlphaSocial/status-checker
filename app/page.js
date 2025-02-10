'use client'

import React, { useEffect, useState } from 'react';
import { Loader } from 'lucide-react';

// Validation helper
const isValidTransactionId = (txId) => {
    return Boolean(txId) && 
           /^[a-zA-Z0-9-_]+$/.test(txId) && 
           txId.length <= 50;
};

export default function PaymentChecker() {
    const [status, setStatus] = useState('checking');
    const [error, setError] = useState(null);
    const [retryCount, setRetryCount] = useState(0);
    const MAX_RETRIES = 40; // 2 minutes total (3s * 40)
    const CHECK_URL = process.env.NEXT_PUBLIC_DATA_SCRIPT_URL;

    useEffect(() => {
        // Create and append status elements like in the original code
        const statusDiv = document.createElement('div');
        statusDiv.id = 'payment-status';
        statusDiv.style.display = 'none';
        
        const statusText = document.createElement('div');
        statusText.id = 'status-text';
        statusDiv.appendChild(statusText);
        
        document.body.appendChild(statusDiv);

        const urlParams = new URLSearchParams(window.location.search);
        const txId = urlParams.get('transactionId');
        
        // Validate transaction ID format
        if (!isValidTransactionId(txId)) {
            console.error('Invalid transaction ID format');
            setError('Invalid transaction ID');
            setStatus('error');
            return;
        }

        const checkTransaction = async () => {
            try {
                // Check retry limit
                if (retryCount >= MAX_RETRIES) {
                    setError('Verification timeout - please try again');
                    setStatus('error');
                    return;
                }

                const response = await fetch(`${CHECK_URL}?transactionId=${txId}`);
                
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const text = await response.text();
                
                let data;
                try {
                    data = JSON.parse(text);
                } catch (e) {
                    console.error('Failed to parse response:', e);
                    throw new Error('Invalid response format');
                }

                if (data.found === true) {
                    setStatus('success');
                    
                    // Update status display exactly like the button code
                    statusDiv.style.display = 'block';
                    statusText.textContent = 'Payment successful!';
                    
                    // Send messages to parent window
                    if (window.parent) {
                        window.parent.postMessage({
                            type: 'payment-success',
                            action: 'show-spin',
                            spins: 3
                        }, '*');

                        window.parent.postMessage({
                            type: 'update-text',
                            text: 'Payment successful!'
                        }, '*');
                        
                        setTimeout(() => window.close(), 2000);
                    }
                } else {
                    setRetryCount(prev => prev + 1);
                    setTimeout(checkTransaction, 3000);
                }
            } catch (error) {
                console.error('Transaction check error:', error);
                setRetryCount(prev => prev + 1);
                
                // Only retry if under max attempts
                if (retryCount < MAX_RETRIES) {
                    setTimeout(checkTransaction, 3000);
                } else {
                    setError('Failed to verify payment');
                    setStatus('error');
                }
            }
        };

        checkTransaction();

        // Cleanup
        return () => {
            if (statusDiv && statusDiv.parentNode) {
                statusDiv.parentNode.removeChild(statusDiv);
            }
        };
    }, [retryCount]);

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
                        {retryCount > 0 && (
                            <p className="text-xs text-gray-400 mt-1">
                                Checking... ({retryCount}/{MAX_RETRIES})
                            </p>
                        )}
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
                        <button
                            onClick={() => window.close()}
                            className="mt-4 w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                        >
                            Close Window
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}