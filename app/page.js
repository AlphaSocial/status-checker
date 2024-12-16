'use client'

import React, { useEffect, useState } from 'react';
import { Loader } from 'lucide-react';

export default function PaymentChecker() {
    const [status, setStatus] = useState('checking');
    const [error, setError] = useState(null);
    const CHECK_URL = 'https://script.google.com/macros/s/AKfycbzzqLT0lGvm3GMm4GDN-2uuW0-xgXmxsMi3ZbziMN4sV7eUmmJbDrSiGhPHXYQPemZH/exec';
    const WRITE_URL = 'https://script.google.com/macros/s/AKfycbxrLoiZmW7Qcd6qu0Vpbr7cpXkiB3y8f-NcOSnkXaRSfYOQyOdJwsr1kj14xvOBY_iK/exec';

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

        // Create pending record immediately when component loads
        const createPendingRecord = async () => {
            try {
                console.log('Creating pending record for:', txId);
                const postData = {
                    transactionId: txId,
                    status: 'pending'
                };
                console.log('Sending data:', postData);
                
                const response = await fetch(WRITE_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(postData)
                });
                console.log('Write response received:', response);
            } catch (error) {
                console.error('Error creating pending record:', error);
                console.error('Error details:', error.message);
            }
        };

        // Call createPendingRecord immediately
        createPendingRecord();

        const checkTransaction = async () => {
            try {
                console.log('Checking transaction:', txId);
                const response = await fetch(`${CHECK_URL}?transactionId=${txId}`);
                const text = await response.text();
                console.log('Response from sheets:', text);
                
                const data = JSON.parse(text);
                console.log('Parsed response:', data);

                if (data.found === true) {
                    console.log('Transaction found! Notifying parent window...');
                    setStatus('success');
                    
                    if (window.opener) {
                        window.opener.postMessage({
                            type: 'update-text',
                            text: 'Payment successful!'
                        }, '*');
                        
                        try {
                            localStorage.setItem('paymentStatus', 'success');
                            localStorage.setItem('lastSuccessfulTx', txId);
                        } catch (e) {
                            console.error('Failed to set localStorage:', e);
                        }
                        
                        setTimeout(() => window.close(), 2000);
                    } else {
                        console.log('No opener window found');
                    }
                } else {
                    console.log('Transaction not found, retrying in 3s...');
                    setTimeout(checkTransaction, 3000);
                }
            } catch (error) {
                console.error('Error checking transaction:', error);
                setTimeout(checkTransaction, 3000);
            }
        };

        // Start checking after a brief delay to allow pending record to be created
        setTimeout(checkTransaction, 1000);

        return () => {
            try {
                localStorage.removeItem('paymentStatus');
            } catch (e) {
                console.error('Failed to clean localStorage:', e);
            }
        };
    }, []);

    // Rest of your component remains the same...
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