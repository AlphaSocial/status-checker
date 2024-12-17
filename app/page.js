'use client'

import React, { useEffect, useState } from 'react';
import { Loader } from 'lucide-react';

export default function PaymentChecker() {
    const [status, setStatus] = useState('checking');
    const [error, setError] = useState(null);
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
                console.log('--------------- NEW CHECK ---------------');
                console.log('Looking for transaction ID:', txId);
                const response = await fetch(`${CHECK_URL}?transactionId=${txId}`);
                const text = await response.text();
                console.log('Raw response from sheets:', text);
                
                const data = JSON.parse(text);
                console.log('Parsed data:', data);
        
                // Check if we found entries
                if (data.items && data.items.length > 0) {
                    console.log(`Found ${data.items.length} items in sheet`);
                    
                    // First, find our specific transaction
                    const ourTransaction = data.items.find(item => {
                        console.log('Examining item:', item);
                        console.log('Comparing transaction IDs:', {
                            'Looking for': txId,
                            'Current item': item.transactionId
                        });
                        return item.transactionId === txId;
                    });
                    
                    if (ourTransaction) {
                        console.log('Found matching transaction:', ourTransaction);
                        console.log('Network field value:', ourTransaction.network);
                        
                        // Check specific field for completion
                        if (ourTransaction.network === 'polygon') {
                            console.log('SUCCESS: Network field is polygon');
                            setStatus('success');
                            
                            if (window.opener) {
                                window.opener.postMessage({
                                    type: 'update-text',
                                    text: 'Payment successful!'
                                }, '*');
                                
                                setTimeout(() => window.close(), 2000);
                            }
                        } else {
                            console.log('WAITING: Network field is not polygon, current value:', ourTransaction.network);
                            setTimeout(checkTransaction, 3000);
                        }
                    } else {
                        console.log('NO MATCH: Transaction ID not found in any items');
                        setTimeout(checkTransaction, 3000);
                    }
                } else {
                    console.log('NO DATA: Sheet returned no items');
                    setTimeout(checkTransaction, 3000);
                }
            } catch (error) {
                console.error('ERROR in check:', error);
                console.error('Error details:', {
                    message: error.message,
                    stack: error.stack
                });
                setTimeout(checkTransaction, 3000);
            }
        };

        // Start checking
        checkTransaction();

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