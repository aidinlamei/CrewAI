"""Export service for generating files."""
from typing import Dict, Any
from io import BytesIO
import pandas as pd
from docx import Document
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
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

    def export_to_excel(self, data: Dict[str, Any]) -> BytesIO:
    @staticmethod
    def export_to_excel(
        data: Dict[str, Any], filename: str = "export.xlsx"
    ) -> BytesIO:
        """
        Export data to Excel format.

        Args:
            data: Dictionary of data to export

        Returns:
            BytesIO buffer containing Excel file
        """
        try:
            buffer = BytesIO()

            # Convert data to DataFrame
            df = pd.DataFrame([data])

            # Write to Excel
            with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
                df.to_excel(writer, index=False, sheet_name='Data')

            buffer.seek(0)
            logger.info("Exported data to Excel successfully")

            return buffer

        except Exception as e:
            logger.error(f"Failed to export to Excel: {e}")
            raise

    def export_to_word(self, data: Dict[str, Any]) -> BytesIO:
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
            data: Dictionary of data to export

        Returns:
            BytesIO buffer containing Word file
        """
        try:
            buffer = BytesIO()

            # Create Word document
            doc = Document()
            doc.add_heading('Export Report', 0)

            # Add data to document
            for key, value in data.items():
                doc.add_heading(str(key), level=2)
                doc.add_paragraph(str(value))

            # Save to buffer
            doc.save(buffer)
            buffer.seek(0)

            logger.info("Exported data to Word successfully")

            return buffer

        except Exception as e:
            logger.error(f"Failed to export to Word: {e}")
            raise

    def export_to_pdf(self, data: Dict[str, Any]) -> BytesIO:
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
            data: Dictionary of data to export

        Returns:
            BytesIO buffer containing PDF file
        """
        try:
            buffer = BytesIO()

            # Create PDF document
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
            story.append(Paragraph("Export Report", styles['Heading1']))
            story.append(Spacer(1, 12))

            # Convert data to table format
            table_data = [['Field', 'Value']]
            for key, value in data.items():
                table_data.append([str(key), str(value)])

            # Create table
            table = Table(table_data)
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 14),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))

            story.append(table)
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

            logger.info("Exported data to PDF successfully")

            return buffer

        except Exception as e:
            logger.error(f"Failed to export to PDF: {e}")
            logger.info(f"Exported to PDF: {filename}")
            return buffer

        except Exception as e:
            logger.error(f"PDF export failed: {str(e)}")
            raise


# Singleton instance
export_service = ExportService()
