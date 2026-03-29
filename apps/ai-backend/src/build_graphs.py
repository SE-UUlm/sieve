import os
from ai_backend.product_flow import product_subgraph
from ai_backend.simple_flow import simple_subgraph
import subprocess
from ai_backend.agent import workflow


def build_graph(filename, graph):
    mermaid_string = graph.get_graph().draw_mermaid()

    with open(filename + ".mmd", "w", encoding="utf-8") as file:
        file.write(mermaid_string)

    subprocess.run(
        [
            "npx",
            "-p",
            "@mermaid-js/mermaid-cli",
            "mmdc",
            "-i",
            f"{filename}.mmd",
            "-o",
            f"../../wiki/assets/{filename}.svg",
        ]
    )

    os.remove(filename + ".mmd")


def build_graphs():
    build_graph("ai_backend_top_level_graph", workflow)
    build_graph("ai_backend_simple_graph", simple_subgraph)
    build_graph("ai_backend_product_graph", product_subgraph)

    print("LangGraph Graph-SVGs saved in wiki/assets")
