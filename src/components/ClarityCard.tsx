import { ClarityCard as ClarityCardType } from "@/lib/types";

interface Props {
    card: ClarityCardType;
}

export default function ClarityCard({ card }: Props) {
    return (
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow h-full">
            <h3 className="font-bold text-slate-900 mb-2">{card.title}</h3>
            <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{card.content}</p>
        </div>
    );
}
