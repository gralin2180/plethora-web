# Local LLM helpers

Training and GGUF conversion happen **on your PC**. Vercel will not fine-tune models for you.

```bash
python create_ollama_model.py --name my-home --from llama3.2 --system "Be direct." --create
python train_lora.py --data my.jsonl --out ./lora-out
```

See `/local-llms` in the web app for VRAM picks and Ollama / LM Studio / llama.cpp paths.
