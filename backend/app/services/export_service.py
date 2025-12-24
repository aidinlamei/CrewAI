"""Export service for generating files."""
from typing import Dict, Any
from io import BytesIO
import pandas as pd
from docx import Document
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from app.utils.logger import logger


class ExportService:
    """Service for exporting data to various formats."""

    def export_to_excel(self, data: Dict[str, Any]) -> BytesIO:
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

            # Build PDF
            doc.build(story)
            buffer.seek(0)

            logger.info("Exported data to PDF successfully")

            return buffer

        except Exception as e:
            logger.error(f"Failed to export to PDF: {e}")
            raise


# Singleton instance
export_service = ExportService()
