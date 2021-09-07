import "source-map-support/register";

import { formatStringResponse, ValidatedEventAPIGatewayProxyEvent } from "@libs/apiGateway";
import { formatBadRequestError, formatJSONResponse } from "@libs/apiGateway";

import { middyfy } from "@libs/lambda";

// import schema from "./schema";
import Web3 from "web3";
import BigNumber from "bignumber.js";
import config from "src/constants/config";
import { toFraction } from "@libs/BigNumber";
import ERC20ABI from "src/constants/erc20Abi";

type queryFilter = "totalsupply" | "maxsupply" | "circulatingsupply";

const tokenSupply: ValidatedEventAPIGatewayProxyEvent<any> = async (event) => {
  console.log("inside handler");
  const infuraURL = `wss://mainnet.infura.io/ws/v3/${config.infuraId}`;
  console.log("infura url", infuraURL);
  const web3Provider = new Web3.providers.WebsocketProvider(infuraURL);
  console.log("web3Provider", web3Provider.toString());
  const web3 = new Web3(web3Provider);

  try {
    console.log("tokenSymbol query", event.queryStringParameters?.tokensymbol);

    const tokenSymbol = event?.queryStringParameters?.tokensymbol ?? config.defaultTokenSymbol;
    console.log("tokenSymbol", tokenSymbol);
    const filter = <queryFilter | void>event?.queryStringParameters?.q;
    console.log("filter", filter);

    const token = config.tokens.find((el) => el.symbol === tokenSymbol);
    console.log("Token details", JSON.stringify(token));

    if (!token) {
      return formatBadRequestError("Invalid Token Symbol");
    }

    //@ts-ignore
    const tokenContract = new web3.eth.Contract(ERC20ABI, token.address);
    const [decimals, totalSupply] = await Promise.all([
      tokenContract.methods["decimals"]().call(),
      tokenContract.methods["totalSupply"]().call(),
    ]);

    const totalSupplyBN = toFraction(totalSupply.toString(), decimals);
    console.log("totalSupply", totalSupplyBN.toString());

    const calculateCirculationSupply = async () => {
      let balanceToBeExcluded = 0;

      if (token.excludeBalancesOf.length !== 0) {
        const excludeBalancePromises = token.excludeBalancesOf.map((account) => {
          return tokenContract.methods["balanceOf"](account).call();
        });

        let excludeBalances = await Promise.all(excludeBalancePromises);
        console.log("exclude Balances of", excludeBalances);
        excludeBalances = excludeBalances.map((balance) => toFraction(balance, decimals));
        console.log("excludeBalanceBN", excludeBalances.toString());
        balanceToBeExcluded = excludeBalances.reduce((acc: BigNumber, cur: BigNumber) => {
          return acc.plus(cur);
        }, new BigNumber(0));
        console.log("balanceToBeExcluded", balanceToBeExcluded.toString());
      }
      return totalSupplyBN.minus(balanceToBeExcluded);
    };

    if (filter) {
      console.log("inside filter condition");
      switch (filter) {
        case "totalsupply": {
          return formatStringResponse(totalSupplyBN.toString());
        }

        case "circulatingsupply": {
          const circulatingSupply = await calculateCirculationSupply();
          return formatStringResponse(circulatingSupply.toString());
        }
        default: {
          console.log("never matched any valid filter");
        }
      }
    }

    const circulatingSupply = await calculateCirculationSupply();
    return formatJSONResponse({
      totalSupply: totalSupplyBN.precision(6),
      circulatingSupply: circulatingSupply.precision(6),
      tokenSymbol: token.symbol,
      tokenName: token.name,
    });
  } catch (error) {
    console.log("Something went wrong error", error);
    return formatJSONResponse({
      error: error.message,
    });
  } finally {
    web3Provider.disconnect(0, "process completed successfully");
  }
};

export const main = middyfy(tokenSupply);
