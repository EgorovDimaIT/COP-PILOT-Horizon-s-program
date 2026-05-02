import os
import docx
from pypdf import PdfReader

def extract_from_docx(path):
    doc = docx.Document(path)
    return "\n".join([p.text for p in doc.paragraphs])

def extract_from_pdf(path):
    reader = PdfReader(path)
    text = ""
    for page in reader.pages:
        text += page.extract_text() + "\n"
    return text

def process_file(file_path, output_path):
    if file_path.endswith(".docx"):
        text = extract_from_docx(file_path)
    elif file_path.endswith(".pdf"):
        text = extract_from_pdf(file_path)
    else:
        return
    
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(text)

files_to_process = [
    "COP-PILOT-OC1-Guide-for-Applicants-1.pdf",
    "COP-PILOT-OC1-Technincal-Guidelines-Platform.pdf",
    "COP-PILOT-SME-Check-list-1.docx",
    "COP-PILOT-SME_OC1_AnnexIII_PrivacyEthics.pdf",
    "COP-PILOT_OC1_DoH-1.docx",
    "COP-PILOT_OC1_FAQ_ (1).pdf",
    "COP-PILOT_OC1_FAQ_.pdf",
    "COP-PILOT_OC1_Proposal_Guidelines-2.docx",
    "DESCA_HorizonEurope_2.1.docx",
    "files/AGROCHAIN-UA_CPOC1_Annexes_DoH_SME_Ethics.docx",
    "files/AGROCHAIN-UA_CPOC1_Proposal_20260504.docx"
]

os.makedirs("temp_text", exist_ok=True)
os.makedirs("temp_text/files", exist_ok=True)

for f in files_to_process:
    src = f
    dst = os.path.join("temp_text", f + ".txt")
    print(f"Processing {src} -> {dst}")
    try:
        process_file(src, dst)
    except Exception as e:
        print(f"Error processing {src}: {e}")
