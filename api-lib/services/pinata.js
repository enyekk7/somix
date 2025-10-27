const axios = require('axios');
const sharp = require('sharp');
const { encode } = require('blurhash');

class PinataService {
  constructor(jwt, gateway) {
    // Use JWT from parameter or environment variable
    this.jwt = jwt || process.env.PINATA_JWT || '';
    this.gateway = gateway || process.env.PINATA_GATEWAY || 'https://gateway.pinata.cloud';
    
    if (!this.jwt) {
      console.warn('⚠️ PINATA_JWT not set. IPFS upload will fail.');
    }
  }

  async uploadFromUrl(imageUrl, metadata) {
    try {
      // Download the image
      const imageResponse = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 30000
      });

      const imageBuffer = Buffer.from(imageResponse.data);
      
      // Generate thumbnail and blurhash
      const thumbnailBuffer = await this.generateThumbnail(imageBuffer);
      const blurHash = await this.generateBlurHash(imageBuffer);

      // Upload original image
      const originalFormData = new FormData();
      originalFormData.append('file', new Blob([imageBuffer]), 'original.jpg');
      
      if (metadata) {
        originalFormData.append('pinataMetadata', JSON.stringify({
          name: metadata.name,
          keyvalues: {
            type: 'original',
            ...metadata.attributes?.reduce((acc, attr) => {
              acc[attr.trait_type] = attr.value.toString();
              return acc;
            }, {})
          }
        }));
      }

      const originalUpload = await this.uploadToPinata(originalFormData);

      // Upload thumbnail
      const thumbFormData = new FormData();
      thumbFormData.append('file', new Blob([thumbnailBuffer]), 'thumbnail.jpg');
      thumbFormData.append('pinataMetadata', JSON.stringify({
        name: `${metadata?.name || 'image'}-thumbnail`,
        keyvalues: { type: 'thumbnail' }
      }));

      const thumbUpload = await this.uploadToPinata(thumbFormData);

      return {
        cid: originalUpload.IpfsHash,
        gatewayUrl: `${this.gateway}/ipfs/${originalUpload.IpfsHash}`,
        thumbUrl: `${this.gateway}/ipfs/${thumbUpload.IpfsHash}`,
        blurHash
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Pinata upload failed: ${error.response?.data?.error?.details || error.message}`);
      }
      throw new Error(`Failed to upload to IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async uploadMetadata(metadata) {
    try {
      const formData = new FormData();
      formData.append('file', new Blob([JSON.stringify(metadata, null, 2)]), 'metadata.json');
      formData.append('pinataMetadata', JSON.stringify({
        name: `${metadata.name}-metadata`,
        keyvalues: { type: 'metadata' }
      }));

      const response = await this.uploadToPinata(formData);
      return `${this.gateway}/ipfs/${response.IpfsHash}`;
    } catch (error) {
      throw new Error(`Failed to upload metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async uploadToPinata(formData) {
    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${this.jwt}`,
          'Content-Type': 'multipart/form-data'
        },
        timeout: 60000
      }
    );

    return response.data;
  }

  async generateThumbnail(imageBuffer) {
    return await sharp(imageBuffer)
      .resize(300, 300, { 
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 80 })
      .toBuffer();
  }

  async generateBlurHash(imageBuffer) {
    try {
      const { data, info } = await sharp(imageBuffer)
        .resize(32, 32, { fit: 'cover' })
        .raw()
        .toBuffer({ resolveWithObject: true });

      return encode(
        new Uint8ClampedArray(data),
        info.width,
        info.height,
        4,
        4
      );
    } catch (error) {
      // Return a default blurhash if generation fails
      return 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';
    }
  }

  async validateJWT() {
    try {
      const response = await axios.get(
        'https://api.pinata.cloud/data/testAuthentication',
        {
          headers: {
            'Authorization': `Bearer ${this.jwt}`
          }
        }
      );
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}

module.exports = PinataService;


