import { GoogleGenerativeAI } from '@google/generative-ai';
import Category from '../models/Category';

export type ParsedTransaction = {
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  paymentMethod: 'PIX' | 'CREDIT_CARD' | 'DEBIT' | 'CASH';
  splitType: 'MINE' | 'HERS' | 'SHARED_50_50' | 'SHARED_CUSTOM';
  categoryId: string;
};

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export class AIService {
  async parseFinancialText(text: string): Promise<ParsedTransaction> {
    const categories = await Category.find({ deletedAt: null }).select('_id name type').sort({ name: 1 });

    if (!categories?.length) {
      throw new Error('Nenhuma categoria cadastrada.');
    }

    const categoryList = categories.map((category) => ({
      id: category._id.toString(),
      name: category.name,
      type: category.type,
    }));

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: [
        'Você é um parser financeiro para o aplicativo SINC.',
        'Responda somente com JSON puro válido, sem markdown e sem texto extra.',
        'O campo amount deve ser um inteiro em centavos. Exemplo: 150 reais vira 15000.',
        'O campo type deve ser INCOME ou EXPENSE.',
        'O campo paymentMethod deve ser PIX, CREDIT_CARD, DEBIT ou CASH.',
        'O campo splitType deve ser MINE, HERS, SHARED_50_50 ou SHARED_CUSTOM.',
        'O campo categoryId deve ser exatamente um dos IDs reais enviados na lista de categorias.',
        'Escolha uma categoria compatível com o type.',
        'Se o texto não informar algum campo, use o padrão mais provável: EXPENSE, PIX e MINE.',
      ].join(' '),
    });

    const prompt = JSON.stringify({
      text,
      categories: categoryList,
      outputShape: {
        description: 'string',
        amount: 'number',
        type: 'INCOME | EXPENSE',
        paymentMethod: 'PIX | CREDIT_CARD | DEBIT | CASH',
        splitType: 'MINE | HERS | SHARED_50_50 | SHARED_CUSTOM',
        categoryId: 'string',
      },
    });

    const result = await model.generateContent(prompt);
    const responseText = await result.response.text();
    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson) as ParsedTransaction;

    this.validateParsedTransaction(parsed, categoryList);

    return parsed;
  }

  private validateParsedTransaction(parsed: ParsedTransaction, categories: Array<{ id: string; type: string }>) {
    const validPaymentMethods = ['PIX', 'CREDIT_CARD', 'DEBIT', 'CASH'];
    const validSplitTypes = ['MINE', 'HERS', 'SHARED_50_50', 'SHARED_CUSTOM'];
    const validTypes = ['INCOME', 'EXPENSE'];
    const category = categories.find((item) => item.id === parsed.categoryId);

    if (!parsed.description || !parsed.amount || !parsed.categoryId) {
      throw new Error('A IA não retornou todos os campos obrigatórios.');
    }

    if (!validTypes.includes(parsed.type)) {
      throw new Error('A IA retornou um tipo inválido.');
    }

    if (!validPaymentMethods.includes(parsed.paymentMethod)) {
      throw new Error('A IA retornou um método de pagamento inválido.');
    }

    if (!validSplitTypes.includes(parsed.splitType)) {
      throw new Error('A IA retornou um tipo de divisão inválido.');
    }

    if (!category || category.type !== parsed.type) {
      throw new Error('A IA retornou uma categoria inválida.');
    }
  }
}
