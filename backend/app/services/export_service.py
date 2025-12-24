"""
Export service for exporting data to various formats.
"""
from typing import Dict, Any
from io import BytesIO
from openpyxl import Workbook
from docx import Document
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate,
    Table,
    TableStyle,
    Paragraph,
    Spacer,
)
from reportlab.lib.styles import getSampleStyleSheet
from app.utils.logger import logger


class ExportService:
    """Service for exporting data to various formats."""

    @staticmethod
    def export_to_excel(
        data: Dict[str, Any], filename: str = "export.xlsx"
    ) -> BytesIO:
        """
        Export data to Excel format.

        Args:
            data: Data to export
            filename: Output filename

        Returns:
            BytesIO buffer with Excel file
        """
        try:
            wb = Workbook()
            ws = wb.active
            ws.title = "Export"

            # Write headers
            headers = list(data.keys())
            ws.append(headers)

            # Write data
            max_rows = max(
                len(v) if isinstance(v, list) else 1 for v in data.values()
            )
            for i in range(max_rows):
                row = []
                for key in headers:
                    value = data[key]
                    if isinstance(value, list) and i < len(value):
                        row.append(value[i])
                    elif not isinstance(value, list):
                        row.append(value if i == 0 else "")
                    else:
                        row.append("")
                ws.append(row)

            # Save to buffer
            buffer = BytesIO()
            wb.save(buffer)
            buffer.seek(0)

            logger.info(f"Exported to Excel: {filename}")
            return buffer

        except Exception as e:
            logger.error(f"Excel export failed: {str(e)}")
            raise

    @staticmethod
    def export_to_word(
        data: Dict[str, Any], filename: str = "export.docx"
    ) -> BytesIO:
        """
        Export data to Word format.

        Args:
            data: Data to export
            filename: Output filename

        Returns:
            BytesIO buffer with Word file
        """
        try:
            doc = Document()
            doc.add_heading("Execution Report", 0)

            # Add data
            for key, value in data.items():
                doc.add_heading(str(key), level=1)
                if isinstance(value, list):
                    for item in value:
                        doc.add_paragraph(str(item), style="List Bullet")
                elif isinstance(value, dict):
                    for k, v in value.items():
                        doc.add_paragraph(f"{k}: {v}")
                else:
                    doc.add_paragraph(str(value))
                doc.add_paragraph()  # Add space

            # Save to buffer
            buffer = BytesIO()
            doc.save(buffer)
            buffer.seek(0)

            logger.info(f"Exported to Word: {filename}")
            return buffer

        except Exception as e:
            logger.error(f"Word export failed: {str(e)}")
            raise

    @staticmethod
    def export_to_pdf(
        data: Dict[str, Any], filename: str = "export.pdf"
    ) -> BytesIO:
        """
        Export data to PDF format.

        Args:
            data: Data to export
            filename: Output filename

        Returns:
            BytesIO buffer with PDF file
        """
        try:
            buffer = BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=letter)
            story = []
            styles = getSampleStyleSheet()

            # Add title
            title = Paragraph("Execution Report", styles["Title"])
            story.append(title)
            story.append(Spacer(1, 12))

            # Add data
            for key, value in data.items():
                # Add section heading
                heading = Paragraph(str(key), styles["Heading1"])
                story.append(heading)

                # Add content
                if isinstance(value, (list, dict)):
                    content = Paragraph(str(value), styles["Normal"])
                else:
                    content = Paragraph(str(value), styles["Normal"])
                story.append(content)
                story.append(Spacer(1, 12))

            # Build PDF
            doc.build(story)
            buffer.seek(0)

            logger.info(f"Exported to PDF: {filename}")
            return buffer

        except Exception as e:
            logger.error(f"PDF export failed: {str(e)}")
            raise


# Singleton instance
export_service = ExportService()
