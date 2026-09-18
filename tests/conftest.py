"""Test Doubles & GenVM Simulation Harness for Civic Deliberation Allocator."""

import json
from pathlib import Path
import sys
import types
from typing import Any, Callable, Dict, Optional
import unittest

# Ensure project root in sys.path
_ROOT = str(Path(__file__).resolve().parent.parent)
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

# Register mock genlayer module
if "genlayer" not in sys.modules:
    genlayer_mod = types.ModuleType("genlayer")

    class UserError(Exception):
        pass

    class Result:
        pass

    class Return(Result):
        def __init__(self, calldata: Any):
            self.calldata = calldata

    class Rollback(Result):
        def __init__(self, error: Any):
            self.error = error

    class VM:
        UserError = UserError
        Result = Result
        Return = Return
        Rollback = Rollback

        @staticmethod
        def run_nondet(leader_fn: Callable[[], Any], validator_fn: Callable[[Result], bool]) -> Any:
            leader_output = leader_fn()
            wrapped = Return(leader_output)
            is_valid = validator_fn(wrapped)
            if not is_valid:
                raise UserError("ERR_CONSENSUS_REJECTED: Validator consensus rejected leader execution")
            return leader_output

    class Message:
        def __init__(self):
            self.sender_address: str = "0x1111111111111111111111111111111111111111"

    class PublicDecorators:
        @staticmethod
        def write(fn: Any) -> Any:
            return fn

        @staticmethod
        def view(fn: Any) -> Any:
            return fn

    class Web:
        def __init__(self):
            self._urls: Dict[str, str] = {}

        def set_url_content(self, url: str, content: str) -> None:
            self._urls[url.strip()] = content

        def clear(self) -> None:
            self._urls.clear()

        def render(self, url: str, mode: str = "text") -> str:
            clean = url.strip()
            if clean in self._urls:
                return self._urls[clean]
            raise RuntimeError(f"404 Not Found: {url}")

    class Nondet:
        def __init__(self):
            self.web = Web()
            self._llm_handler: Optional[Callable[[str], Any]] = None

        def set_llm_handler(self, handler: Optional[Callable[[str], Any]]) -> None:
            self._llm_handler = handler

        def exec_prompt(self, prompt: str, response_format: str = "json") -> str:
            if self._llm_handler is not None:
                res = self._llm_handler(prompt)
                return res if isinstance(res, str) else json.dumps(res)
            return json.dumps({"clusters": [], "evaluations": []})

    class Contract:
        pass

    class TreeMap(dict):
        pass

    def u256(val: Any) -> int:
        return int(val)

    genlayer_mod.Contract = Contract
    genlayer_mod.TreeMap = TreeMap
    genlayer_mod.u256 = u256
    genlayer_mod.vm = VM
    genlayer_mod.message = Message()
    genlayer_mod.public = PublicDecorators()
    genlayer_mod.nondet = Nondet()

    sys.modules["genlayer"] = genlayer_mod
