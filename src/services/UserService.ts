import User from '../models/User';
import Household from '../models/Household';
import Category from '../models/Category';
import Card from '../models/Card';
import Goal from '../models/Goal';
import RecurringExpense from '../models/RecurringExpense';
import Transaction from '../models/Transaction';

export function resolveOwnerId(user: { id: string; role: string; managedUserId?: string | null }): string {
  if (user.role === 'ADMIN' && user.managedUserId) {
    return user.managedUserId;
  }

  return user.id;
}

export async function resolveEffectiveUserId(userId: string): Promise<string> {
  const user = await User.findById(userId).select('role managedUserId');

  if (!user) {
    return userId;
  }

  if (user.role === 'ADMIN' && user.managedUserId) {
    return user.managedUserId.toString();
  }

  return userId;
}

/** Resolve único, sem criar nada — use para leituras (list). Retorna null se o usuário ainda não tem vínculo. */
export async function resolveHouseholdId(userId: string): Promise<string | null> {
  const effectiveUserId = await resolveEffectiveUserId(userId);
  const effectiveUser = await User.findById(effectiveUserId).select('householdId');

  return effectiveUser?.householdId ? effectiveUser.householdId.toString() : null;
}

/** Use para escritas (create/update/delete) — cria um household "solo" na primeira vez, se ainda não existir. */
export async function getOrCreateHouseholdId(userId: string): Promise<string> {
  const effectiveUserId = await resolveEffectiveUserId(userId);
  const effectiveUser = await User.findById(effectiveUserId).select('householdId');

  if (!effectiveUser) {
    throw new Error('Usuário não encontrado.');
  }

  if (effectiveUser.householdId) {
    return effectiveUser.householdId.toString();
  }

  const household = await Household.create({ members: [effectiveUser._id] });
  effectiveUser.householdId = household._id as any;
  await effectiveUser.save();

  return household._id.toString();
}

export async function getHouseholdMemberIds(userId: string): Promise<string[]> {
  const householdId = await resolveHouseholdId(userId);

  if (!householdId) {
    return [];
  }

  const household = await Household.findById(householdId).select('members');

  return (household?.members || []).map((id) => id.toString());
}

export class UserService {
  async listUsers() {
    return await User.find().sort({ name: 1 });
  }

  async listPartners(userId: string) {
    const effectiveUserId = await resolveEffectiveUserId(userId);
    const memberIds = await getHouseholdMemberIds(userId);
    const partnerIds = memberIds.filter((id) => id !== effectiveUserId);

    if (!partnerIds.length) {
      return [];
    }

    return await User.find({ _id: { $in: partnerIds } }).select('name avatarUrl').sort({ name: 1 });
  }

  async updateUser(id: string, data: { name?: string; role?: string; phone?: string; avatarUrl?: string; managedUserId?: string | null }) {
    const user = await User.findByIdAndUpdate(id, data, { new: true, runValidators: true });

    if (!user) {
      throw new Error('Usuário não encontrado.');
    }

    return user;
  }

  async linkCouple(userIdA: string, userIdB: string) {
    if (userIdA === userIdB) {
      throw new Error('Selecione dois usuários diferentes.');
    }

    const [userA, userB] = await Promise.all([User.findById(userIdA), User.findById(userIdB)]);

    if (!userA || !userB) {
      throw new Error('Usuário não encontrado.');
    }

    const householdIdA = userA.householdId?.toString() || null;
    const householdIdB = userB.householdId?.toString() || null;

    // Se os dois já tiverem household próprio (ex: cada um já usava o app sozinho),
    // a de A "sobrevive" e absorve os membros e os dados (categorias, cartões, metas,
    // gastos fixos, transações) da de B, para nada ficar órfão.
    const survivingHouseholdId = householdIdA || householdIdB;
    const obsoleteHouseholdId = householdIdA && householdIdB && householdIdA !== householdIdB ? householdIdB : null;

    const household = survivingHouseholdId
      ? await Household.findById(survivingHouseholdId)
      : await Household.create({ members: [] });

    if (!household) {
      throw new Error('Não foi possível localizar o vínculo existente.');
    }

    const memberIds = new Set(household.members.map((id) => id.toString()));

    if (obsoleteHouseholdId) {
      const obsoleteHousehold = await Household.findById(obsoleteHouseholdId).select('members');
      (obsoleteHousehold?.members || []).forEach((id) => memberIds.add(id.toString()));
    }

    memberIds.add(userA._id.toString());
    memberIds.add(userB._id.toString());
    household.members = Array.from(memberIds) as any;
    await household.save();

    await User.updateMany({ _id: { $in: Array.from(memberIds) } }, { householdId: household._id });

    if (obsoleteHouseholdId) {
      await Promise.all([
        Category.updateMany({ householdId: obsoleteHouseholdId }, { householdId: household._id }),
        Card.updateMany({ householdId: obsoleteHouseholdId }, { householdId: household._id }),
        Goal.updateMany({ householdId: obsoleteHouseholdId }, { householdId: household._id }),
        RecurringExpense.updateMany({ householdId: obsoleteHouseholdId }, { householdId: household._id }),
        Transaction.updateMany({ householdId: obsoleteHouseholdId }, { householdId: household._id }),
      ]);
      await Household.findByIdAndDelete(obsoleteHouseholdId);
    }

    return household;
  }
}
