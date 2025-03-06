import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Heading,
  VStack,
  HStack,
  Text,
  Button,
  useDisclosure,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  useToast,
} from '@chakra-ui/react';
import { CreateAuctionModal } from '../components/CreateAuctionModal';
import { AuctionCard } from '../components/AuctionCard';
import { contractService } from '../services/contractService';
import { ethers } from 'ethers';

interface UserDashboardProps {
  account: string;
  onLogout: () => void;
}

interface AuctionData {
  id: number;
  seller: string;
  itemName: string;
  description: string;
  startingPrice: string;
  highestBid: string;
  highestBidder: string;
  startTime: number;
  endTime: number;
  ended: boolean;
  active: boolean;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({ account, onLogout }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [activeAuctions, setActiveAuctions] = useState<AuctionData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalValue, setTotalValue] = useState("0");
  const [userBids, setUserBids] = useState<AuctionData[]>([]);
  const [pendingReturn, setPendingReturn] = useState("0");
  const toast = useToast();

  const fetchPendingReturns = async () => {
    try {
      // Get pending returns for the current user
      const pendingAmount = await contractService.getPendingReturn(account);
      setPendingReturn(pendingAmount);

      // If amount is greater than 0, show a notification
      if (Number(pendingAmount) > 0) {
        toast({
          title: 'Funds Available',
          description: `You have ${pendingAmount} ETH available to withdraw`,
          status: 'info',
          duration: null,  // Won't auto-dismiss
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error fetching pending returns:', error);
    }
  };

  const fetchActiveAuctions = async () => {
    try {
      setIsLoading(true);
      const auctions = await contractService.getActiveAuctions();
      setActiveAuctions(auctions);

      // Get pending returns
      const pendingAmount = await contractService.getPendingReturn(account);
      console.log('Pending returns:', pendingAmount); // Add this for debugging
      setPendingReturn(pendingAmount);

      // Calculate total value
      const total = auctions.reduce((acc, auction) => {
        const value = ethers.utils.parseEther(
          auction.highestBid === "0" ? auction.startingPrice : auction.highestBid
        );
        return acc.add(value);
      }, ethers.BigNumber.from(0));
      
      setTotalValue(ethers.utils.formatEther(total));

      // Filter user's bids
      const userAuctions = auctions.filter(
        auction => auction.highestBidder.toLowerCase() === account.toLowerCase()
      );
      setUserBids(userAuctions);

    } catch (error) {
      console.error('Error fetching auctions:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch active auctions',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveAuctions();
    // Set up an interval to refresh auctions every minute
    const interval = setInterval(fetchActiveAuctions, 60000);
    return () => clearInterval(interval);
  }, [account]);

  // Add this effect to check for pending returns periodically
  useEffect(() => {
    const checkPendingReturns = setInterval(fetchPendingReturns, 30000); // Check every 30 seconds
    return () => clearInterval(checkPendingReturns);
  }, [account]);

  const handleAuctionCreated = () => {
    fetchActiveAuctions();
  };

  const formatTimeLeft = (endTime: number) => {
    const now = Math.floor(Date.now() / 1000);
    const timeLeft = endTime - now;
    
    if (timeLeft <= 0) {
      return "Ended";
    }
    
    const days = Math.floor(timeLeft / (24 * 3600));
    const hours = Math.floor((timeLeft % (24 * 3600)) / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const handleBid = async (auctionId: number, currentBid: string) => {
    try {
      const bidAmount = window.prompt(`Enter bid amount in ETH (must be higher than ${currentBid} ETH):`);
      if (!bidAmount) return;

      // Validate bid amount
      const currentBidWei = ethers.utils.parseEther(currentBid);
      const newBidWei = ethers.utils.parseEther(bidAmount);
      
      if (newBidWei.lte(currentBidWei)) {
        toast({
          title: 'Invalid Bid',
          description: 'Bid must be higher than current bid',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      setIsLoading(true);
      await contractService.placeBid(auctionId, bidAmount);
      
      toast({
        title: 'Bid Placed',
        description: 'Your bid has been placed successfully!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Refresh the auctions list
      await fetchActiveAuctions();
    } catch (error: any) {
      console.error('Error placing bid:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to place bid. Make sure you have enough ETH.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndAuction = async (auctionId: number) => {
    try {
      setIsLoading(true);
      await contractService.endAuction(auctionId);
      
      // Wait a bit for the blockchain to update
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Fetch the updated pending returns
      await fetchActiveAuctions();
      
      toast({
        title: 'Auction Ended',
        description: 'The auction has been ended successfully. Check your pending returns.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error: any) {
      console.error('Error ending auction:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to end auction',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async () => {
    try {
      setIsLoading(true);
      // First check if user has any funds to withdraw
      const pendingAmount = await contractService.getPendingReturn(account);
      
      if (parseFloat(pendingAmount) === 0) {
        toast({
          title: 'No funds to withdraw',
          description: 'You have no pending funds to withdraw',
          status: 'info',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      await contractService.withdraw();
      
      toast({
        title: 'Withdrawal Successful',
        description: `Successfully withdrew ${pendingAmount} ETH`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Refresh the auctions to update any relevant data
      await fetchActiveAuctions();
    } catch (error: any) {
      console.error('Error withdrawing funds:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to withdraw funds',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box minH="100vh" bg="gray.50">
      <Container maxW="container.xl" py={8}>
        {/* Header */}
        <HStack justify="space-between" mb={8}>
          <VStack align="start">
            <Heading size="lg">Dashboard</Heading>
            <Text color="gray.600">
              Account: {account.slice(0, 6)}...{account.slice(-4)}
            </Text>
          </VStack>
          <Button onClick={onLogout} colorScheme="red" variant="outline">
            Disconnect Wallet
          </Button>
        </HStack>

        {/* Stats Section */}
        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6} mb={8}>
          <StatCard
            label="Active Auctions"
            value={activeAuctions.length.toString()}
            helpText="Total active auctions"
          />
          <StatCard
            label="Your Active Bids"
            value={userBids.length.toString()}
            helpText="Auctions you're bidding on"
          />
          <StatCard
            label="Total Value Locked"
            value={`${Number(totalValue).toFixed(3)} ETH`}
            helpText="Combined value of all auctions"
          />
          <StatCard
            label="Your Auctions"
            value={activeAuctions.filter(a => a.seller.toLowerCase() === account.toLowerCase()).length.toString()}
            helpText="Auctions you created"
          />
        </SimpleGrid>

        {/* Actions Section */}
        <Grid templateColumns={{ base: "1fr", md: "3fr 1fr" }} gap={8}>
          {/* Main Content */}
          <VStack align="stretch" spacing={6}>
            <HStack justify="space-between" mb={4}>
              <Box>
                <Text color="gray.600">Pending Returns</Text>
                <Text fontSize="xl" fontWeight="bold">
                  {Number(pendingReturn) > 0 ? `${pendingReturn} ETH` : "No pending returns"}
                </Text>
              </Box>
              <Button
                colorScheme="green"
                onClick={handleWithdraw}
                isLoading={isLoading}
                isDisabled={Number(pendingReturn) === 0}
              >
                Withdraw Funds
              </Button>
            </HStack>
            <HStack justify="space-between">
              <Heading size="md">Active Auctions</Heading>
              <Button
                colorScheme="purple"
                onClick={onOpen}
                isLoading={isLoading}
              >
                + Create Auction
              </Button>
            </HStack>
            
            {/* Auction Cards */}
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              {activeAuctions.map((auction) => {
                const isActive = !auction.ended && auction.endTime > Math.floor(Date.now() / 1000);
                // Always use starting price if no bids have been placed
                const currentBid = auction.highestBidder === "0x0000000000000000000000000000000000000000" 
                  ? auction.startingPrice 
                  : auction.highestBid;
                
                return (
                  <AuctionCard
                    key={auction.id}
                    title={auction.itemName}
                    description={auction.description}
                    currentBid={currentBid}
                    timeLeft={formatTimeLeft(auction.endTime)}
                    isOwner={auction.seller.toLowerCase() === account.toLowerCase()}
                    onBid={() => handleBid(auction.id, currentBid)}
                    onEnd={() => handleEndAuction(auction.id)}
                    isEnded={!isActive}
                    isLoading={isLoading}
                    highestBidder={auction.highestBidder !== "0x0000000000000000000000000000000000000000" ? auction.highestBidder : undefined}
                  />
                );
              })}
            </SimpleGrid>
          </VStack>

          {/* Sidebar */}
          <VStack align="stretch" spacing={4}>
            <Card>
              <CardHeader>
                <Heading size="sm">Your Active Bids</Heading>
              </CardHeader>
              <CardBody>
                {userBids.length > 0 ? (
                  <VStack align="stretch" spacing={3}>
                    {userBids.map(auction => (
                      <HStack key={auction.id} justify="space-between">
                        <Text>{auction.itemName}</Text>
                        <Text fontWeight="bold">{auction.highestBid} ETH</Text>
                      </HStack>
                    ))}
                  </VStack>
                ) : (
                  <Text color="gray.500">No active bids</Text>
                )}
              </CardBody>
            </Card>
          </VStack>
        </Grid>

        {/* Create Auction Modal */}
        <CreateAuctionModal 
          isOpen={isOpen} 
          onClose={onClose} 
          onAuctionCreated={handleAuctionCreated}
        />
      </Container>
    </Box>
  );
};

// StatCard Component
const StatCard: React.FC<{
  label: string;
  value: string;
  helpText: string;
}> = ({ label, value, helpText }) => (
  <Card>
    <CardBody>
      <Stat>
        <StatLabel>{label}</StatLabel>
        <StatNumber>{value}</StatNumber>
        <StatHelpText>{helpText}</StatHelpText>
      </Stat>
    </CardBody>
  </Card>
);

export default UserDashboard; 