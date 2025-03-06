import { ethers } from 'ethers';
import ABI from './AIB.json';
import { Alchemy, Network } from 'alchemy-sdk';

const CONTRACT_ADDRESS = "0xbC83C14d01b1989a9f74358Aa864501872752d65";

// Alchemy setup
const settings = {
  apiKey: "Ao4j_PT__hX3L-SR715jKPR-uSP27VOb",
  network: Network.ETH_SEPOLIA,
};

const alchemy = new Alchemy(settings);

export class ContractService {
  private contract: ethers.Contract;
  private provider: ethers.providers.Web3Provider;

  constructor() {
    this.provider = new ethers.providers.Web3Provider(window.ethereum);
    this.contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      ABI,
      this.provider.getSigner()
    );
  }

  async createAuction(
    itemName: string,
    description: string,
    startingPrice: string,
    durationInMinutes: number
  ) {
    try {
      const priceInWei = ethers.utils.parseEther(startingPrice);
      const tx = await this.contract.createAuction(
        itemName,
        description,
        priceInWei,
        durationInMinutes
      );
      await tx.wait();
      return tx;
    } catch (error) {
      console.error('Error creating auction:', error);
      throw error;
    }
  }

  async getActiveAuctions() {
    try {
      // First get total auctions
      const totalAuctions = await this.contract.totalAuctions();
      const activeAuctions = [];

      // Iterate through all auctions and check if they're active
      for (let i = 0; i < totalAuctions; i++) {
        try {
          const auction = await this.getAuction(i);
          if (auction.active && !auction.ended) {
            activeAuctions.push(auction);
          }
        } catch (error) {
          console.error(`Error fetching auction ${i}:`, error);
        }
      }

      return activeAuctions;
    } catch (error) {
      console.error('Error getting active auctions:', error);
      throw error;
    }
  }

  async getAuction(auctionId: number) {
    try {
      const auction = await this.contract.getAuction(auctionId);
      const startingPrice = ethers.utils.formatEther(auction.startingPrice);
      const highestBid = ethers.utils.formatEther(auction.highestBid);
      
      return {
        id: auction.id.toNumber(),
        seller: auction.seller,
        itemName: auction.itemName,
        description: auction.description,
        startingPrice: startingPrice,
        highestBid: highestBid === startingPrice && auction.highestBidder === "0x0000000000000000000000000000000000000000" 
          ? startingPrice 
          : highestBid,
        highestBidder: auction.highestBidder,
        startTime: auction.startTime.toNumber(),
        endTime: auction.endTime.toNumber(),
        ended: auction.ended,
        active: auction.active
      };
    } catch (error) {
      console.error('Error getting auction:', error);
      throw error;
    }
  }

  async placeBid(auctionId: number, bidAmount: string) {
    try {
      // Convert bid amount to Wei
      const bidAmountWei = ethers.utils.parseEther(bidAmount);
      
      // Place the bid with the value in the transaction
      const tx = await this.contract.placeBid(auctionId, {
        value: bidAmountWei
      });
      
      // Wait for transaction to be mined
      await tx.wait();
      return tx;
    } catch (error: any) {
      // Extract the revert reason if available
      if (error.data) {
        const decodedError = error.data.replace('0x', '');
        const reason = ethers.utils.toUtf8String('0x' + decodedError.slice(136));
        throw new Error(reason);
      }
      throw error;
    }
  }

  async endAuction(auctionId: number) {
    try {
      const tx = await this.contract.endAuction(auctionId);
      await tx.wait();
      return tx;
    } catch (error) {
      console.error('Error ending auction:', error);
      throw error;
    }
  }

  async cancelAuction(auctionId: number) {
    try {
      const tx = await this.contract.cancelAuction(auctionId);
      await tx.wait();
      return tx;
    } catch (error) {
      console.error('Error cancelling auction:', error);
      throw error;
    }
  }

  async withdraw() {
    try {
      console.log('Initiating withdrawal...');
      const tx = await this.contract.withdraw();
      console.log('Waiting for withdrawal transaction...');
      await tx.wait();
      console.log('Withdrawal complete');
      return tx;
    } catch (error: any) {
      console.error('Error in withdraw:', error);
      if (error.data) {
        const decodedError = error.data.replace('0x', '');
        const reason = ethers.utils.toUtf8String('0x' + decodedError.slice(136));
        throw new Error(reason);
      }
      throw error;
    }
  }

  async getPendingReturn(address: string) {
    try {
      const pendingReturn = await this.contract.getPendingReturn(address);
      const formattedAmount = ethers.utils.formatEther(pendingReturn);
      console.log('Pending return for', address, ':', formattedAmount, 'ETH');
      return formattedAmount;
    } catch (error) {
      console.error('Error getting pending return:', error);
      throw error;
    }
  }
}

export const contractService = new ContractService(); 