import { Request, Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/User';
import { AIService } from '../services/AIService';
import { TransactionService } from '../services/TransactionService';
import { WhatsAppService } from '../services/WhatsAppService';

const aiService = new AIService();
const transactionService = new TransactionService();
const whatsAppService = new WhatsAppService();

function onlyDigits(value: string) {
  return value.replace(/\D/g, '');
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount / 100);
}

export class WhatsAppController {
  verify(req: Request, res: Response) {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const isValid = mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN;

    if (!isValid) {
      return res.sendStatus(403);
    }

    return res.status(200).send(challenge);
  }

  async receive(req: Request, res: Response) {
    const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (!message) {
      return res.status(200).json({ ignored: true });
    }

    if (message.type !== 'text') {
      return res.status(200).json({ ignored: true });
    }

    const phone = message.from;
    const text = message.text?.body;

    if (!phone || !text) {
      return res.status(200).json({ ignored: true });
    }

    try {
      const phoneDigits = onlyDigits(phone);
      const user = await User.findOne({ phone: { $in: [phone, phoneDigits, `+${phoneDigits}`] } });

      if (!user) {
        await whatsAppService.sendText(phone, 'Seu número não está autorizado no SINC.');
        return res.status(200).json({ ignored: true });
      }

      const parsedTransaction = await aiService.parseFinancialText(text);
      const transaction = await transactionService.createTransaction({
        ...parsedTransaction,
        categoryId: new mongoose.Types.ObjectId(parsedTransaction.categoryId),
        date: new Date(),
        paidBy: user._id,
        isRecurring: false,
      });

      const amount = Array.isArray(transaction) ? transaction?.[0]?.amount : transaction.amount;
      await whatsAppService.sendText(phone, `✅ ${formatCurrency(amount || parsedTransaction.amount)} salvos com sucesso!`);

      return res.status(200).json({ success: true });
    } catch (error) {
      await whatsAppService.sendText(phone, 'Não consegui salvar essa transação. Confira a mensagem e tente novamente.');
      return res.status(200).json({ success: false });
    }
  }
}
