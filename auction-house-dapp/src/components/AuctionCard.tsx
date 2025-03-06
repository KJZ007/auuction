import React from 'react';
import {
  Box,
  Image,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Card,
  CardBody,
} from '@chakra-ui/react';

interface AuctionCardProps {
  title: string;
  description: string;
  currentBid: string;
  timeLeft: string;
  isOwner: boolean;
  onBid: () => void;
  onEnd: () => void;
  isEnded: boolean;
  isLoading?: boolean;
  highestBidder?: string;
  imageUrl?: string;
}

export const AuctionCard: React.FC<AuctionCardProps> = ({
  title,
  description,
  currentBid,
  timeLeft,
  isOwner,
  onBid,
  onEnd,
  isEnded,
  isLoading = false,
  highestBidder,
}) => {
  return (
    <Card>
      <CardBody>
        <VStack align="stretch" spacing={3}>
          <Heading size="md">{title}</Heading>
          <Text color="gray.600" noOfLines={2}>
            {description}
          </Text>
          <HStack justify="space-between">
            <Box>
              <Text color="gray.500">
                {highestBidder ? "Current Bid" : "Starting Price"}
              </Text>
              <Text fontWeight="bold">{currentBid} ETH</Text>
              {highestBidder && (
                <Text fontSize="sm" color="gray.500">
                  by: {highestBidder.slice(0, 6)}...{highestBidder.slice(-4)}
                </Text>
              )}
            </Box>
            <Box>
              <Text color="gray.500">Status</Text>
              <Text 
                fontWeight="bold"
                color={isEnded ? "red.500" : "green.500"}
              >
                {timeLeft}
              </Text>
            </Box>
          </HStack>
          {!isEnded ? (
            isOwner ? (
              <Button 
                colorScheme="red" 
                onClick={onEnd}
                isLoading={isLoading}
              >
                End Auction
              </Button>
            ) : (
              <Button 
                colorScheme="purple" 
                onClick={onBid}
                isLoading={isLoading}
              >
                Place Bid
              </Button>
            )
          ) : (
            <Button isDisabled>
              {highestBidder ? 'Auction Ended' : 'No Bids Placed'}
            </Button>
          )}
        </VStack>
      </CardBody>
    </Card>
  );
}; 