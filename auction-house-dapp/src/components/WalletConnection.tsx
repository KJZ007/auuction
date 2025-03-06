import React from 'react';
import { Button, Text, VStack, useToast, Menu, MenuButton, MenuList, MenuItem } from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';

declare global {
  interface Window {
    ethereum?: any;
  }
}

interface WalletConnectionProps {
  onConnect: (account: string) => void;
}

export const WalletConnection: React.FC<WalletConnectionProps> = ({ onConnect }) => {
  const [account, setAccount] = useState<string>('');
  const [accounts, setAccounts] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkWalletConnection();
    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
    }
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  const handleAccountsChanged = (newAccounts: string[]) => {
    if (newAccounts.length === 0) {
      handleDisconnect();
    } else {
      setAccounts(newAccounts);
      setAccount(newAccounts[0]);
      setIsConnected(true);
      onConnect(newAccounts[0]);
      navigate('/dashboard');
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setAccount('');
    setAccounts([]);
    onConnect('');
    navigate('/');
    toast({
      title: 'Wallet Disconnected',
      description: 'Your wallet has been disconnected',
      status: 'warning',
      duration: 3000,
      isClosable: true,
      position: 'top'
    });
  };

  const checkWalletConnection = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const accounts = await ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setAccounts(accounts);
          setAccount(accounts[0]);
          setIsConnected(true);
        }
      }
    } catch (error) {
      console.error("Error checking wallet connection:", error);
    }
  };

  const handleConnect = async () => {
    try {
      const { ethereum } = window;
      
      if (!ethereum) {
        toast({
          title: 'MetaMask not detected',
          description: 'Please install MetaMask browser extension',
          status: 'error',
          duration: 5000,
          isClosable: true,
          position: 'top'
        });
        return;
      }

      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      setAccounts(accounts);
      setAccount(accounts[0]);
      setIsConnected(true);
      onConnect(accounts[0]);
      
      toast({
        title: 'Wallet Connected',
        description: 'Successfully connected to your MetaMask wallet',
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top'
      });

      navigate('/dashboard');

    } catch (error) {
      console.error("Error connecting wallet:", error);
      toast({
        title: 'Connection Error',
        description: 'Failed to connect to wallet',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top'
      });
    }
  };

  const switchAccount = async (newAccount: string) => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: window.ethereum.chainId }], // Keep the same network
      });
      
      // Request to switch to the selected account
      await window.ethereum.request({
        method: 'eth_requestAccounts',
        params: [{ eth_accounts: [newAccount] }],
      });
      
      setAccount(newAccount);
      
      toast({
        title: 'Account Switched',
        description: `Switched to account: ${newAccount.slice(0, 6)}...${newAccount.slice(-4)}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top'
      });
    } catch (error) {
      console.error("Error switching account:", error);
      toast({
        title: 'Error Switching Account',
        description: 'Failed to switch account',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top'
      });
    }
  };

  return (
    <VStack spacing={4}>
      {!isConnected ? (
        <Button
          onClick={handleConnect}
          colorScheme="purple"
          size="lg"
          _hover={{ transform: 'scale(1.05)' }}
          transition="all 0.2s"
        >
          Connect Wallet
        </Button>
      ) : (
        <Menu>
          <MenuButton
            as={Button}
            colorScheme="purple"
            size="lg"
            _hover={{ transform: 'scale(1.05)' }}
            transition="all 0.2s"
          >
            {`${account.slice(0, 6)}...${account.slice(-4)}`}
          </MenuButton>
          <MenuList>
            {accounts.map((acc) => (
              <MenuItem
                key={acc}
                onClick={() => switchAccount(acc)}
                backgroundColor={acc === account ? 'purple.50' : undefined}
              >
                {`${acc.slice(0, 6)}...${acc.slice(-4)}`}
              </MenuItem>
            ))}
          </MenuList>
        </Menu>
      )}
    </VStack>
  );
}; 