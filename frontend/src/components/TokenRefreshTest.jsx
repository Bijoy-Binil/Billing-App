import React, { useState } from 'react';
import api from '../api';

const TokenRefreshTest = () => {
  const [testResult, setTestResult] = useState('');
  const [isTesting, setIsTesting] = useState(false);

  const testTokenRefresh = async () => {
    setIsTesting(true);
    setTestResult('Testing token refresh...');

    try {
      // First, let's make a normal API call to ensure everything works
      const response = await api.get('http://127.0.0.1:8000/api/customers/');
      
      if (response.status === 200) {
        setTestResult('✅ Normal API call successful');
        
        // Now let's test what happens when we manually expire the token
        // This simulates the scenario where the server returns a 401
        const originalToken = localStorage.getItem('accessToken');
        
        // Temporarily set an invalid token to trigger refresh
        localStorage.setItem('accessToken', 'invalid_token_for_testing');
        
        try {
          // This should trigger the token refresh mechanism
          const response2 = await api.get('http://127.0.0.1:8000/api/customers/');
          
          if (response2.status === 200) {
            setTestResult(prev => prev + '\n✅ Token refresh successful! API call completed after automatic token refresh');
          }
        } catch (error) {
          setTestResult(prev => prev + '\n❌ Token refresh failed: ' + error.message);
        } finally {
          // Restore the original token
          if (originalToken) {
            localStorage.setItem('accessToken', originalToken);
          }
        }
      }
    } catch (error) {
      setTestResult('❌ Initial API call failed: ' + error.message);
    } finally {
      setIsTesting(false);
    }
  };

  const checkTokenStatus = () => {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    
    return {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      accessTokenLength: accessToken ? accessToken.length : 0,
      refreshTokenLength: refreshToken ? refreshToken.length : 0
    };
  };

  const tokenStatus = checkTokenStatus();

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h3 className="text-lg font-semibold text-emerald-400 mb-4">Token Refresh Test</h3>
      
      <div className="mb-4 p-4 bg-gray-700 rounded-lg">
        <h4 className="text-sm font-medium text-gray-300 mb-2">Current Token Status:</h4>
        <div className="text-sm text-gray-400 space-y-1">
          <div>Access Token: {tokenStatus.hasAccessToken ? '✅ Present' : '❌ Missing'} ({tokenStatus.accessTokenLength} chars)</div>
          <div>Refresh Token: {tokenStatus.hasRefreshToken ? '✅ Present' : '❌ Missing'} ({tokenStatus.refreshTokenLength} chars)</div>
        </div>
      </div>

      <button
        onClick={testTokenRefresh}
        disabled={isTesting}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
      >
        {isTesting ? 'Testing...' : 'Test Token Refresh'}
      </button>

      {testResult && (
        <div className="mt-4 p-4 bg-gray-700 rounded-lg">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Test Results:</h4>
          <pre className="text-sm text-gray-400 whitespace-pre-wrap">{testResult}</pre>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500">
        <p>Note: This test will temporarily set an invalid access token to trigger the refresh mechanism.</p>
        <p>Make sure you have a valid refresh token in localStorage before running this test.</p>
      </div>
    </div>
  );
};

export default TokenRefreshTest;