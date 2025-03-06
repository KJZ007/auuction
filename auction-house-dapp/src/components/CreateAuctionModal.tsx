import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Select,
  HStack,
  useToast,
} from '@chakra-ui/react';
import { contractService } from '../services/contractService';

interface CreateAuctionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuctionCreated?: () => void;
}

interface FormData {
  itemName: string;
  description: string;
  startingPrice: string;
  duration: number;
  durationUnit: 'minutes' | 'hours' | 'days';
}

export const CreateAuctionModal: React.FC<CreateAuctionModalProps> = ({ 
  isOpen, 
  onClose,
  onAuctionCreated 
}) => {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    itemName: '',
    description: '',
    startingPrice: '',
    duration: 1,
    durationUnit: 'minutes'
  });

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePriceChange = (valueString: string) => {
    const cleanValue = valueString.replace(/[^\d.]/g, '');
    const parts = cleanValue.split('.');
    const finalValue = parts[0] + (parts.length > 1 ? '.' + parts[1] : '');
    
    setFormData(prev => ({
      ...prev,
      startingPrice: finalValue
    }));
  };

  const calculateDurationInMinutes = (): number => {
    const { duration, durationUnit } = formData;
    switch (durationUnit) {
      case 'hours':
        return duration * 60;
      case 'days':
        return duration * 24 * 60;
      default:
        return duration;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const durationInMinutes = calculateDurationInMinutes();
      await contractService.createAuction(
        formData.itemName,
        formData.description,
        formData.startingPrice,
        durationInMinutes
      );

      toast({
        title: 'Auction Created',
        description: 'Your auction has been created successfully!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      onAuctionCreated?.();
      onClose();
    } catch (error) {
      console.error('Error creating auction:', error);
      toast({
        title: 'Error',
        description: 'Failed to create auction. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent as="form" onSubmit={handleSubmit}>
        <ModalHeader>Create New Auction</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Item Name</FormLabel>
              <Input 
                placeholder="Enter item name"
                value={formData.itemName}
                onChange={(e) => handleInputChange('itemName', e.target.value)}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Description</FormLabel>
              <Input 
                placeholder="Enter item description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Starting Price (ETH)</FormLabel>
              <NumberInput
                min={0}
                precision={6}
                value={formData.startingPrice}
                onChange={handlePriceChange}
                step={0.000001}
              >
                <NumberInputField placeholder="0.000000" />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Duration</FormLabel>
              <HStack spacing={4}>
                <NumberInput 
                  min={1} 
                  flex={1}
                  value={formData.duration}
                  onChange={(value) => handleInputChange('duration', parseInt(value))}
                >
                  <NumberInputField placeholder="Enter duration" />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <Select 
                  defaultValue="minutes" 
                  width="120px"
                  value={formData.durationUnit}
                  onChange={(e) => handleInputChange('durationUnit', e.target.value as 'minutes' | 'hours' | 'days')}
                >
                  <option value="minutes">Minutes</option>
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                </Select>
              </HStack>
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button 
            colorScheme="purple" 
            type="submit"
            isLoading={isLoading}
            loadingText="Creating..."
          >
            Create Auction
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}; 