import { create as ipfsHttpClient } from "ipfs-http-client";
import axios from "axios";
import { ethers } from "ethers";

// initialize IPFS
const client = ipfsHttpClient("https://ipfs.infura.io:5001/api/v0");

// mint an NFT
export const createExtras = async (
  minterContract,
  performActions,
  { name, price, description, ipfsImage, ownerAddress, attributes }
) => {
  await performActions(async (kit) => {
    if (!name || !description || !ipfsImage) return;
    const { defaultAccount } = kit;

    // convert NFT metadata to JSON format
    const data = JSON.stringify({
      name,
      price,
      description,
      image: ipfsImage,
      owner: defaultAccount,
      attributes,
    });

    try {
      // save NFT metadata to IPFS
      const added = await client.add(data);

      // IPFS url for uploaded metadata
      const url = `https://ipfs.infura.io/ipfs/${added.path}`;
      const _price = ethers.utils.parseUnits(String(price), "ether");

      // mint the NFT and save the IPFS url to the blockchain
      let transaction = await minterContract.methods
        .safeMint(url, _price)
        .send({ from: defaultAccount });

      return transaction;
    } catch (error) {
      console.log("Error uploading file: ", error);
    }
  });
};

// function to upload a file to IPFS
export const uploadToIpfs = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const added = await client.add(file, {
      progress: (prog) => console.log(`received: ${prog}`),
    });
    return `https://ipfs.infura.io/ipfs/${added.path}`;
  } catch (error) {
    console.log("Error uploading file: ", error);
  }
};

// fetch all NFTs on the smart contract
export const getExtras = async (minterContract) => {
  try {
    const nfts = [];
    const nftsLength = await minterContract.methods.getExtrasLength().call();
    for (let i = 0; i < Number(nftsLength); i++) {
      const nft = new Promise(async (resolve) => {
        const extras = await minterContract.methods.getExtras(i).call();
        const res = await minterContract.methods.tokenURI(i).call();
        const meta = await fetchNftMeta(res);
        const owner = await fetchNftOwner(minterContract, i);
        resolve({
          index: i,
          tokenId: i,
          owner,
          price: extras.price,
          sold: extras.sold,
          name: meta.data.name,
          image: meta.data.image,
          description: meta.data.description,
          attributes: meta.data.attributes,
        });
      });
      nfts.push(nft);
    }
    return Promise.all(nfts);
  } catch (e) {
    console.log({ e });
  }
};

// get the metedata for an NFT from IPFS
export const fetchNftMeta = async (ipfsUrl) => {
  try {
    if (!ipfsUrl) return null;
    const meta = await axios.get(ipfsUrl);
    return meta;
  } catch (e) {
    console.log({ e });
  }
};

// get the owner address of an NFT
export const fetchNftOwner = async (minterContract, index) => {
  try {
    return await minterContract.methods.ownerOf(index).call();
  } catch (e) {
    console.log({ e });
  }
};

// get the address that deployed the NFT contract
export const fetchNftContractOwner = async (minterContract) => {
  try {
    let owner = await minterContract.methods.owner().call();
    return owner;
  } catch (e) {
    console.log({ e });
  }
};

export const buyExtras = async (
  minterContract,
  index,
  tokenId,
  performActions
) => {
  try {
    await performActions(async (kit) => {
      const { defaultAccount } = kit;
      const extras = await minterContract.methods.getExtras(index).call();
      await minterContract.methods
        .buyExtras(tokenId)
        .send({ from: defaultAccount, value: extras.price });
    });
  } catch (error) {
    console.log({ error });
  }
};

export const sellExtras = async (minterContract, tokenId, performActions) => {
  try {
    await performActions(async (kit) => {
      const { defaultAccount } = kit;
      await minterContract.methods
        .sellExtras(tokenId)
        .send({ from: defaultAccount });
    });
  } catch (error) {
    console.log({ error });
  }
};