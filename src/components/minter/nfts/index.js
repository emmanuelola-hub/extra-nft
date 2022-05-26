import { useContractKit } from "@celo-tools/use-contractkit";
import React, { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import PropTypes from "prop-types";
import AddNfts from "./Add";
import Nft from "./Card";
import Loader from "../../ui/Loader";
import { NotificationSuccess, NotificationError } from "../../ui/Notifications";
import {
  getExtras,
  sellExtras,
  buyExtras,
  fetchNftContractOwner,
  createExtras,
} from "../../../utils/minter";
import { Row } from "react-bootstrap";

const NftList = ({ minterContract, name }) => {
  /* performActions : used to run smart contract interactions in order
   *  address : fetch the address of the connected wallet
   */
  const { performActions, address, kit } = useContractKit();
  const [nfts, setNfts] = useState([]);
  const [myNfts, setMyNfts] = useState([]);
  const [marketNfts, setMarketNfts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nftOwner, setNftOwner] = useState(null);
  const { defaultAccount } = kit;
  const getAssets = useCallback(async () => {
    try {
      setLoading(true);

      // fetch all nfts from the smart contract
      const allNfts = await getExtras(minterContract);
      console.log(allNfts);
      const myNFTs = allNfts.filter((nft) => nft.owner === defaultAccount);
      const marketNFTs = allNfts.filter((nft) => nft.owner !== defaultAccount);
      setMyNfts(myNFTs);
      setMarketNfts(marketNFTs);
      if (!allNfts) return;
      setNfts(allNfts);
    } catch (error) {
      console.log({ error });
    } finally {
      setLoading(false);
    }
  }, [minterContract]);

  const addNft = async (data) => {
    try {
      setLoading(true);
      console.log(data);
      // create an nft functionality
      await createExtras(minterContract, performActions, data);
      toast(<NotificationSuccess text="Updating NFT list...." />);
      getAssets();
    } catch (error) {
      console.log({ error });
      toast(<NotificationError text="Failed to create an NFT." />);
    } finally {
      setLoading(false);
    }
  };

  const buyNft = async (index, tokenId) => {
    try {
      setLoading(true);
      await buyExtras(minterContract, index, tokenId, performActions);
      getAssets();
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const sellNft = async (index) => {
    try {
      setLoading(true);
      await sellExtras(minterContract, index, performActions);
      getAssets();
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchContractOwner = useCallback(async (minterContract) => {
    // get the address that deployed the NFT contract
    const _address = await fetchNftContractOwner(minterContract);
    setNftOwner(_address);
  }, []);

  useEffect(() => {
    try {
      if (address && minterContract) {
        getAssets();
        fetchContractOwner(minterContract);
      }
    } catch (error) {
      console.log({ error });
    }
  }, [minterContract, address, getAssets, fetchContractOwner]);
  if (address) {
    return (
      <>
        {!loading ? (
          <>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h1 className="fs-4 fw-bold mb-0">{name}</h1>

              <AddNfts save={addNft} address={address} />
            </div>
            <h2  className="fs-4 fw-bold mb-4">MarketPlace</h2>

            <Row xs={1} sm={2} lg={3} className="g-3  mb-5 g-xl-4 g-xxl-5">
              {/* display all NFTs */}
              {marketNfts.map((_nft) => (
                <Nft
                  name={"MarketPlace"}
                  key={_nft.index}
                  contractOwner={defaultAccount}
                  buyNft={() => buyNft(_nft.index, _nft.tokenId)}
                  sellNft={() => sellNft(_nft.tokenId)}
                  nft={{
                    ..._nft,
                  }}
                />
              ))}
            </Row>
            <hr />
            <h2  className="fs-4 fw-bold mb-2">My NFTs</h2>
            <Row xs={1} sm={2} lg={3} className="g-3  mb-5 g-xl-4 g-xxl-5">
              {/* display all NFTs */}
              {myNfts.map((_nft) => (
                <Nft
                  name={"My NFTs"}
                  key={_nft.index}
                  contractOwner={defaultAccount}
                  buyNft={() => buyNft(_nft.index, _nft.tokenId)}
                  sellNft={() => sellNft(_nft.tokenId)}
                  nft={{
                    ..._nft,
                  }}
                />
              ))}
            </Row>
          </>
        ) : (
          <Loader />
        )}
      </>
    );
  }
  return null;
};

NftList.propTypes = {
  // props passed into this component
  minterContract: PropTypes.instanceOf(Object),
  updateBalance: PropTypes.func.isRequired,
};

NftList.defaultProps = {
  minterContract: null,
};

export default NftList;
