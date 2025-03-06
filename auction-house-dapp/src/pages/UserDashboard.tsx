import { Box, Button, Container, Heading, Text, VStack, useToast } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

interface UserDashboardProps {
  account: string;
  onLogout: () => void;
}

const UserDashboard = ({ account, onLogout }: UserDashboardProps) => {
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    if (!account) {
      navigate('/');
    }
  }, [account, navigate]);

  const handleLogout = () => {
    onLogout();
    toast({
      title: 'Logged Out',
      description: 'Successfully disconnected wallet',
      status: 'info',
      duration: 3000,
      isClosable: true,
      position: 'top'
    });
    navigate('/');
  };

  return (
    <Box
      minH="100vh"
      bg="gray.50"
      py={20}
      backgroundImage="linear-gradient(120deg, #f6d365 0%, #fda085 100%)"
    >
      <Container maxW="container.lg">
        <VStack spacing={8}>
          <Heading color="white" textShadow="2px 2px 4px rgba(0,0,0,0.2)">
            Welcome to Your Dashboard
          </Heading>
          <Text color="white" fontSize="lg">
            Connected Account: {account.slice(0, 6)}...{account.slice(-4)}
          </Text>
          <Button
            onClick={handleLogout}
            colorScheme="red"
            size="lg"
            _hover={{ transform: 'scale(1.05)' }}
            transition="all 0.2s"
          >
            Disconnect Wallet
          </Button>
        </VStack>
      </Container>
    </Box>
  );
};

export default UserDashboard; 