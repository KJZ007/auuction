import { Box, Container, Heading, Text, VStack } from '@chakra-ui/react';
import WalletConnection from '../components/WalletConnection';

const LandingPage = () => {
  return (
    <Box
      minH="100vh"
      bg="gray.50"
      py={20}
      backgroundImage="linear-gradient(120deg, #f6d365 0%, #fda085 100%)"
    >
      <Container maxW="container.lg">
        <VStack spacing={8} textAlign="center">
          <Heading
            fontSize={{ base: "4xl", md: "6xl" }}
            fontWeight="bold"
            color="white"
            textShadow="2px 2px 4px rgba(0,0,0,0.2)"
          >
            Decentralized Auction House
          </Heading>
          
          <Text
            fontSize={{ base: "lg", md: "xl" }}
            color="white"
            maxW="600px"
            textShadow="1px 1px 2px rgba(0,0,0,0.1)"
          >
            Create and participate in transparent, secure auctions powered by blockchain technology
          </Text>
          
          <Box
            bg="white"
            p={8}
            borderRadius="xl"
            boxShadow="xl"
            w={{ base: "90%", md: "400px" }}
          >
            <WalletConnection />
          </Box>
        </VStack>
      </Container>
    </Box>
  );
};

export default LandingPage; 