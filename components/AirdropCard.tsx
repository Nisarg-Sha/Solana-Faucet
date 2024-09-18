'use client';
import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { Input } from './ui/input';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from './ui/dropdown-menu';

const MAX_REQUESTS = 2;
const TIME_WINDOW = 60 * 60 * 1000;
const TRANSACTION_TIMEOUT_MS = 60 * 1000; // 60 seconds timeout for transaction confirmation

export default function AirdropCard() {
  const [network, setNetwork] = useState<'devnet' | 'testnet'>('devnet');
  const [walletAddress, setWalletAddress] = useState('');
  const [amount, setAmount] = useState('1 SOL');
  const [loading, setLoading] = useState(false);
  const [canRequest, setCanRequest] = useState(true);

  useEffect(() => {
    checkRateLimit();
  }, []);

  const checkRateLimit = () => {
    const storedRequests = JSON.parse(localStorage.getItem('airdropRequests') || '[]');
    const now = Date.now();

    const validRequests = storedRequests.filter((timestamp: number) => now - timestamp < TIME_WINDOW);
    localStorage.setItem('airdropRequests', JSON.stringify(validRequests));

    if (validRequests.length >= MAX_REQUESTS) {
      setCanRequest(false);
    } else {
      setCanRequest(true);
    }
  };

  const confirmTransactionWithTimeout = async (connection: Connection, signature: string, timeoutMs: number) => {
    const start = Date.now();

    while (Date.now() - start < timeoutMs) {
      const { value } = await connection.getSignatureStatus(signature);
      if (value && value.confirmationStatus === 'confirmed') {
        return value;
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    throw new Error('Transaction confirmation timed out.');
  };

  const handleAirdrop = async () => {
    if (!walletAddress) {
      toast.error('Please enter a valid wallet address');
      return;
    }

    try {
      setLoading(true);
      const connection = new Connection(
        "process.env.ALCHEMY_API_KEY",
        'confirmed'
      );
      const publicKey = new PublicKey(walletAddress);
      const solAmount = amount === '1 SOL' ? 1 * LAMPORTS_PER_SOL : 2 * LAMPORTS_PER_SOL;

      // Request airdrop
      const toastId = toast('Requesting airdrop...', { duration: Infinity });
      const airdropSignature = await connection.requestAirdrop(publicKey, solAmount);

      // Custom transaction confirmation with timeout
      const confirmation = await confirmTransactionWithTimeout(connection, airdropSignature, TRANSACTION_TIMEOUT_MS);

      if (confirmation && confirmation.confirmationStatus === 'confirmed') {
        toast.success(`Airdrop of ${amount} on ${network} successful!`, { id: toastId });

        const storedRequests = JSON.parse(localStorage.getItem('airdropRequests') || '[]');
        storedRequests.push(Date.now());
        localStorage.setItem('airdropRequests', JSON.stringify(storedRequests));

        checkRateLimit();
      } else {
        throw new Error('Transaction failed or timed out.');
      }
    } catch (error) {
      toast.error('Airdrop failed. Please try again later.');
      console.error('Airdrop error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-black rounded-lg shadow-md w-96">
      <div className='flex items-center justify-between gap-3'>
        <h2 className="text-xl font-bold text-white">Request Airdrop</h2>
        <div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                  <Button variant="default">
                    {network}
                  </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className='bg-black text-white'>
                  <DropdownMenuItem onClick={() => setNetwork('devnet')}>devnet</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setNetwork('testnet')}>testnet</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
    </div>
    <p className="text-gray-400 mt-2">Maximum of 2 requests per hour</p>

      <div className="flex mt-4 justify-between gap-2">
        <Input
          placeholder="Wallet Address"
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
          className="w-full"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
              <Button variant="outline">
                {amount}
              </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className='bg-black text-white'>
              <DropdownMenuItem onClick={() => setAmount('1 SOL')}>1 SOL</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setAmount('2 SOL')}>2 SOL</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-6">
        <Button
          className="w-full"
          disabled={!walletAddress || loading || !canRequest}
          onClick={handleAirdrop}
        >
          {loading ? (
            <span className="mr-2 animate-spin">🔄</span>
          ) : (
            <span className="mr-2">🔄</span>
          )}
          {canRequest ? 'Confirm Airdrop' : 'Rate Limited'}
        </Button>
        {!canRequest && (
          <p className="mt-2 text-red-500">You have reached the airdrop limit. Please try again later.</p>
        )}
      </div>
    </div>
  );
}
