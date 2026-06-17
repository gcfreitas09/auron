import { useState, type FormEvent } from "react";

type CommandInputProps = {
  onSubmit: (command: string) => void;
};

function CommandInput({ onSubmit }: CommandInputProps) {
  const [value, setValue] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const command = value.trim();
    if (!command) {
      return;
    }

    onSubmit(command);
    setValue("");
  }

  return (
    <form className="command-input" onSubmit={handleSubmit}>
      <input
        type="text"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Digite um comando para o ATLAS..."
        aria-label="Digite um comando para o ATLAS"
        autoComplete="off"
        spellCheck={false}
      />
    </form>
  );
}

export default CommandInput;
