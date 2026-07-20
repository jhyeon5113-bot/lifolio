import { memo } from "react";
import Image from "next/image";
import { OptionsForm } from "@/components/consult/OptionsForm";
import { OptionExpectationsForm, type OptionExpectation } from "@/components/consult/OptionExpectationsForm";
import { CriteriaForm } from "@/components/consult/CriteriaForm";
import { SummaryCard } from "@/components/consult/SummaryCard";
import { ReflectionDatePicker } from "@/components/consult/ReflectionDatePicker";
import type { ConsultMessage } from "@/app/(app)/consult/types";

const WIDE_KINDS = new Set(["summary", "optionsQuestion", "optionExpectations", "criteriaQuestion", "reflectionDate"]);

function ChatMessageImpl({
  message,
  decisionId,
  onOptionsSubmit,
  onOptionExpectationsSubmit,
  onCriteriaSubmit,
  onFinalChoice,
  onReflectionDate,
}: {
  message: ConsultMessage;
  decisionId: string | null;
  onOptionsSubmit: (messageId: string, options: string[]) => void;
  onOptionExpectationsSubmit: (messageId: string, expectations: OptionExpectation[]) => void;
  onCriteriaSubmit: (messageId: string, criteria: string[]) => void;
  onFinalChoice: (messageId: string, choice: string, confidence: number) => void;
  onReflectionDate: (messageId: string, date: Date | null) => void;
}) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end gap-4 ml-auto max-w-[85%]">
        <div className="p-5 bg-primary-container text-on-primary-container rounded-l-2xl rounded-br-2xl shadow-sm">
          <p className="text-body-md">{message.content}</p>
        </div>
      </div>
    );
  }

  const bubbleWidth = WIDE_KINDS.has(message.kind) ? "max-w-[95%]" : "max-w-[85%]";

  return (
    <div className={`flex gap-4 ${bubbleWidth}`}>
      <div className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden relative bg-white shadow-sm">
        <Image src="/mascot-magnifier.png" alt="Lifolio AI" fill sizes="40px" className="object-cover scale-110" />
      </div>
      {message.kind === "typing" && (
        <div className="p-5 bg-white rounded-r-2xl rounded-bl-2xl shadow-sm border border-outline-variant/20 flex gap-1 items-center">
          <span className="w-2 h-2 rounded-full bg-outline-variant animate-bounce [animation-delay:-0.3s]" />
          <span className="w-2 h-2 rounded-full bg-outline-variant animate-bounce [animation-delay:-0.15s]" />
          <span className="w-2 h-2 rounded-full bg-outline-variant animate-bounce" />
        </div>
      )}
      {message.kind === "text" && (
        <div className="p-5 bg-white rounded-r-2xl rounded-bl-2xl shadow-sm border border-outline-variant/20">
          <p className="text-on-surface text-body-md">{message.content}</p>
        </div>
      )}
      {message.kind === "optionsQuestion" && (
        <OptionsForm
          question={message.question}
          locked={message.locked}
          answer={message.answer}
          onSubmit={(options) => onOptionsSubmit(message.id, options)}
        />
      )}
      {message.kind === "optionExpectations" && (
        <OptionExpectationsForm
          options={message.options}
          locked={message.locked}
          answer={message.answer}
          onSubmit={(expectations) => onOptionExpectationsSubmit(message.id, expectations)}
        />
      )}
      {message.kind === "criteriaQuestion" && (
        <CriteriaForm
          question={message.question}
          choices={message.choices}
          locked={message.locked}
          answer={message.answer}
          onSubmit={(criteria) => onCriteriaSubmit(message.id, criteria)}
        />
      )}
      {message.kind === "summary" && (
        <SummaryCard
          summary={message.summary}
          options={message.options}
          matches={message.matches}
          chosen={message.chosen}
          confidence={message.confidence}
          locked={message.locked}
          onSubmit={(choice, confidence) => onFinalChoice(message.id, choice, confidence)}
          returnTo={decisionId ? `/consult?decisionId=${decisionId}` : undefined}
        />
      )}
      {message.kind === "reflectionDate" && (
        <ReflectionDatePicker
          locked={message.locked}
          answer={message.answer}
          onSelect={(date) => onReflectionDate(message.id, date)}
        />
      )}
    </div>
  );
}

// Chat history re-renders on every keystroke in the input box (same
// component owns `input` state) — memo keeps already-rendered bubbles
// (especially SummaryCard, which does its own case-matching work) from
// re-running every time, as long as the message object and handlers are
// referentially stable.
export const ChatMessage = memo(ChatMessageImpl);
