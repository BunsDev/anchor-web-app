import {
  demicrofy,
  formatLuna,
  stripULuna,
  uLuna,
} from '@anchor-protocol/notation';
import { TxInfoParseError } from 'errors/TxInfoParseError';
import { TransactionResult } from 'models/transaction';
import {
  Data,
  pickAttributeValue,
  pickEvent,
  pickRawLog,
} from 'queries/txInfos';
import { pickTxFee, TxResult } from 'transactions/tx';

interface Params {
  txResult: TxResult;
  txInfo: Data;
}

export function pickWithdrawResult({
  txInfo,
  txResult,
}: Params): TransactionResult {
  const rawLog = pickRawLog(txInfo, 0);

  if (!rawLog) {
    throw new TxInfoParseError(txResult, txInfo, 'Undefined the RawLog');
  }

  const transfer = pickEvent(rawLog, 'transfer');

  console.log('pickWithdrawResult.ts..pickWithdrawResult()', transfer);

  console.log(
    'pickWithdrawResult.ts..pickWithdrawResult()',
    JSON.stringify(transfer, null, 2),
  );

  if (!transfer) {
    throw new TxInfoParseError(
      txResult,
      txInfo,
      'Undefined the transfer event',
    );
  }

  /**
   {
     "type": "transfer",
     "attributes": [
       {
         "key": "recipient",
         "value": "terra1x46rqay4d3cssq8gxxvqz8xt6nwlz4td20k38v"
       },
       {
         "key": "sender",
         "value": "terra1kzx23xs8v9yggf6lqpwgerg455e8xzsv0s0glf"
       },
       {
         "key": "amount",
         "value": "20000000uluna"
       }
     ]
   }
   */

  const unbondedAmount = pickAttributeValue<string>(transfer, 2);

  const txFee = pickTxFee(txResult);

  const txHash = txResult.result.txhash;

  return {
    txInfo,
    txResult,
    txFee,
    txHash,
    details: [
      !!unbondedAmount && {
        name: 'Unbonded Amount',
        value: formatLuna(demicrofy(stripULuna(unbondedAmount))) + ' Luna',
      },
    ],
  };
}
